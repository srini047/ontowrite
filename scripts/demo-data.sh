#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
ONTOLOGY_ID="org_ontology"

command -v jq >/dev/null || {
  echo "Install jq first: brew install jq"
  exit 1
}

echo "Loading existing ontology..."
DATA=$(curl -fsS "$BASE/api/ontologies")

# Helpers ----------------------------------------------------------------

lookup_class_id() {
  jq -r --arg name "$1" \
    '([.classes[] | select(.name == $name)][0] // {})["$id"] // empty' \
    <<< "$DATA"
}

ensure_class() {
  local name="$1"
  local description="$2"
  local existing payload response row

  existing=$(lookup_class_id "$name")

  if [[ -n "$existing" ]]; then
    RESULT_ID="$existing"
    echo "Using existing class: $name"
    return
  fi

  payload=$(jq -n \
    --arg oid "$ONTOLOGY_ID" \
    --arg name "$name" \
    --arg description "$description" \
    '{
      kind: "classes",
      data: {
        ontologyId: $oid,
        name: $name,
        parentClassId: "",
        description: $description
      }
    }')

  response=$(curl -fsS -X POST "$BASE/api/ontology-items" \
    -H "Content-Type: application/json" \
    -d "$payload")

  row=$(jq -c '.row' <<< "$response")
  RESULT_ID=$(jq -r '.["$id"]' <<< "$row")

  DATA=$(jq --argjson row "$row" '.classes += [$row]' <<< "$DATA")
  echo "Created class: $name"
}

ensure_property() {
  local class_id="$1"
  local name="$2"
  local value_type="$3"
  local required="$4"
  local payload response row

  if jq -e --arg cid "$class_id" --arg name "$name" \
    'any(.properties[]; .classId == $cid and .name == $name)' \
    <<< "$DATA" >/dev/null; then
    return
  fi

  payload=$(jq -n \
    --arg cid "$class_id" \
    --arg name "$name" \
    --arg vt "$value_type" \
    --argjson required "$required" \
    '{
      kind: "properties",
      data: {
        classId: $cid,
        name: $name,
        valueType: $vt,
        isRequired: $required
      }
    }')

  response=$(curl -fsS -X POST "$BASE/api/ontology-items" \
    -H "Content-Type: application/json" \
    -d "$payload")

  row=$(jq -c '.row' <<< "$response")
  DATA=$(jq --argjson row "$row" '.properties += [$row]' <<< "$DATA")

  echo "Created property: $name"
}

ensure_relationship() {
  local name="$1"
  local source_id="$2"
  local target_id="$3"
  local description="$4"
  local existing payload response row

  existing=$(jq -r \
    --arg oid "$ONTOLOGY_ID" \
    --arg name "$name" \
    '([.relationships[] |
      select(.ontologyId == $oid and .name == $name)][0] // {})["$id"] // empty' \
    <<< "$DATA")

  if [[ -n "$existing" ]]; then
    echo "Using existing relationship: $name"
    return
  fi

  payload=$(jq -n \
    --arg oid "$ONTOLOGY_ID" \
    --arg name "$name" \
    --arg source "$source_id" \
    --arg target "$target_id" \
    --arg description "$description" \
    '{
      kind: "relationships",
      data: {
        ontologyId: $oid,
        name: $name,
        sourceClassId: $source,
        targetClassId: $target,
        description: $description
      }
    }')

  response=$(curl -fsS -X POST "$BASE/api/ontology-items" \
    -H "Content-Type: application/json" \
    -d "$payload")

  row=$(jq -c '.row' <<< "$response")
  DATA=$(jq --argjson row "$row" '.relationships += [$row]' <<< "$DATA")

  echo "Created relationship: $name"
}

add_assertion() {
  local subject="$1"
  local predicate="$2"
  local object="$3"
  local payload response row

  # Skip exact triples already present in the ontology.
  if jq -e \
    --arg oid "$ONTOLOGY_ID" \
    --arg subject "$subject" \
    --arg predicate "$predicate" \
    --arg object "$object" \
    'any(.assertions[];
      .ontologyId == $oid and
      .subjectRef == $subject and
      .predicate == $predicate and
      .objectRef == $object)' \
    <<< "$DATA" >/dev/null; then
    return
  fi

  payload=$(jq -n \
    --arg oid "$ONTOLOGY_ID" \
    --arg subject "$subject" \
    --arg predicate "$predicate" \
    --arg object "$object" \
    '{
      ontologyId: $oid,
      subjectRef: $subject,
      predicate: $predicate,
      objectRef: $object
    }')

  response=$(curl -fsS -X POST "$BASE/api/assertions" \
    -H "Content-Type: application/json" \
    -d "$payload")

  row=$(jq -c '.assertion' <<< "$response")
  DATA=$(jq --argjson row "$row" '.assertions += [$row]' <<< "$DATA")

  echo "Added: $subject --$predicate--> $object"
}

add_entity() {
  local ref="$1"
  local type="$2"
  local name="$3"

  add_assertion "$ref" "rdf:type" "class:$type"
  add_assertion "$ref" "name" "$name"
}

# 1. Schema ---------------------------------------------------------------

ensure_class "Department" "An organizational department."
DEPT_CLASS_ID="$RESULT_ID"

ensure_class "Project" "A project owned by an organization."
PROJECT_CLASS_ID="$RESULT_ID"

PERSON_CLASS_ID=$(lookup_class_id "Person")
ORG_CLASS_ID=$(lookup_class_id "Organization")

if [[ -z "$PERSON_CLASS_ID" || -z "$ORG_CLASS_ID" ]]; then
  echo "Person and Organization classes must exist first."
  exit 1
fi

ensure_property "$DEPT_CLASS_ID" "name" "string" true
ensure_property "$DEPT_CLASS_ID" "location" "string" false
ensure_property "$PROJECT_CLASS_ID" "name" "string" true
ensure_property "$PROJECT_CLASS_ID" "status" "string" true
ensure_property "$PROJECT_CLASS_ID" "deadline" "date" false
ensure_property "$PERSON_CLASS_ID" "title" "string" false
ensure_property "$ORG_CLASS_ID" "employeeCount" "integer" false

ensure_relationship "manages" "$PERSON_CLASS_ID" "$DEPT_CLASS_ID" \
  "A person manages a department."

ensure_relationship "contributesTo" "$PERSON_CLASS_ID" "$PROJECT_CLASS_ID" \
  "A person contributes to a project."

ensure_relationship "belongsTo" "$DEPT_CLASS_ID" "$ORG_CLASS_ID" \
  "A department belongs to an organization."

ensure_relationship "ownedBy" "$PROJECT_CLASS_ID" "$ORG_CLASS_ID" \
  "A project is owned by an organization."

ensure_relationship "reportsTo" "$PERSON_CLASS_ID" "$PERSON_CLASS_ID" \
  "A person reports to another person."

ensure_relationship "collaboratesWith" "$PERSON_CLASS_ID" "$PERSON_CLASS_ID" \
  "Two people collaborate."

ensure_relationship "dependsOn" "$PROJECT_CLASS_ID" "$PROJECT_CLASS_ID" \
  "A project depends on another project."

# 2. People ---------------------------------------------------------------

add_entity "person:maya" "Person" "Maya Chen"
add_entity "person:liam" "Person" "Liam Patel"
add_entity "person:zoe" "Person" "Zoe Williams"
add_entity "person:ethan" "Person" "Ethan Brooks"
add_entity "person:sara" "Person" "Sara Kim"
add_entity "person:nora" "Person" "Nora Shah"
add_entity "person:ivan" "Person" "Ivan Petrov"
add_entity "person:priya" "Person" "Priya Rao"

# 3. Organizations --------------------------------------------------------

add_entity "org:globex" "Organization" "Globex Corporation"
add_entity "org:initech" "Organization" "Initech"

# Acme Corporation and Alex Morgan already exist in the seeded data.

# 4. Departments ----------------------------------------------------------

add_entity "dept:engineering" "Department" "Engineering"
add_entity "dept:research" "Department" "Research"
add_entity "dept:design" "Department" "Design"
add_entity "dept:sales" "Department" "Sales"
add_entity "dept:data" "Department" "Data Science"

# 5. Projects -------------------------------------------------------------

add_entity "project:apollo" "Project" "Project Apollo"
add_entity "project:orion" "Project" "Project Orion"
add_entity "project:phoenix" "Project" "Project Phoenix"
add_entity "project:atlas" "Project" "Project Atlas"
add_entity "project:nova" "Project" "Project Nova"

# 6. Extra literal facts --------------------------------------------------

add_assertion "person:maya" "title" "Engineering Lead"
add_assertion "person:liam" "title" "Research Manager"
add_assertion "person:zoe" "title" "Product Designer"
add_assertion "person:sara" "title" "Sales Director"

add_assertion "dept:engineering" "location" "San Francisco"
add_assertion "dept:research" "location" "Bengaluru"
add_assertion "dept:design" "location" "London"
add_assertion "dept:sales" "location" "New York"
add_assertion "dept:data" "location" "Bengaluru"

add_assertion "project:apollo" "status" "Active"
add_assertion "project:orion" "status" "Planning"
add_assertion "project:phoenix" "status" "Active"
add_assertion "project:atlas" "status" "Review"
add_assertion "project:nova" "status" "Planning"

add_assertion "org:globex" "employeeCount" "850"
add_assertion "org:initech" "employeeCount" "420"
add_assertion "org:acme" "employeeCount" "1200"

# 7. Employment: Person -> Organization -------------------------------

add_assertion "person:maya" "worksFor" "org:globex"
add_assertion "person:liam" "worksFor" "org:acme"
add_assertion "person:zoe" "worksFor" "org:initech"
add_assertion "person:ethan" "worksFor" "org:globex"
add_assertion "person:sara" "worksFor" "org:acme"
add_assertion "person:nora" "worksFor" "org:initech"
add_assertion "person:ivan" "worksFor" "org:globex"
add_assertion "person:priya" "worksFor" "org:acme"

# 8. Department ownership: Department -> Organization -------------

add_assertion "dept:engineering" "belongsTo" "org:acme"
add_assertion "dept:research" "belongsTo" "org:globex"
add_assertion "dept:design" "belongsTo" "org:initech"
add_assertion "dept:sales" "belongsTo" "org:acme"
add_assertion "dept:data" "belongsTo" "org:globex"

# 9. Managers: Person -> Department ---------------------------------

add_assertion "person:maya" "manages" "dept:engineering"
add_assertion "person:liam" "manages" "dept:research"
add_assertion "person:zoe" "manages" "dept:design"
add_assertion "person:sara" "manages" "dept:sales"
add_assertion "person:priya" "manages" "dept:data"

# 10. Project ownership: Project -> Organization ---------------------

add_assertion "project:apollo" "ownedBy" "org:acme"
add_assertion "project:orion" "ownedBy" "org:globex"
add_assertion "project:phoenix" "ownedBy" "org:initech"
add_assertion "project:atlas" "ownedBy" "org:acme"
add_assertion "project:nova" "ownedBy" "org:globex"

# 11. Contributors: Person -> Project -------------------------------

add_assertion "person:maya" "contributesTo" "project:apollo"
add_assertion "person:ethan" "contributesTo" "project:apollo"
add_assertion "person:liam" "contributesTo" "project:orion"
add_assertion "person:zoe" "contributesTo" "project:phoenix"
add_assertion "person:nora" "contributesTo" "project:atlas"
add_assertion "person:ivan" "contributesTo" "project:nova"
add_assertion "person:priya" "contributesTo" "project:apollo"
add_assertion "person:alex" "contributesTo" "project:phoenix"

# 12. Reporting lines: Person -> Person -----------------------------

add_assertion "person:liam" "reportsTo" "person:maya"
add_assertion "person:zoe" "reportsTo" "person:maya"
add_assertion "person:ethan" "reportsTo" "person:liam"
add_assertion "person:sara" "reportsTo" "person:maya"
add_assertion "person:nora" "reportsTo" "person:zoe"
add_assertion "person:ivan" "reportsTo" "person:ethan"
add_assertion "person:priya" "reportsTo" "person:sara"

# 13. Collaboration: Person -> Person -------------------------------

add_assertion "person:maya" "collaboratesWith" "person:ethan"
add_assertion "person:liam" "collaboratesWith" "person:zoe"
add_assertion "person:sara" "collaboratesWith" "person:priya"
add_assertion "person:alex" "collaboratesWith" "person:nora"

# 14. Project dependencies: Project -> Project ----------------------

add_assertion "project:phoenix" "dependsOn" "project:apollo"
add_assertion "project:atlas" "dependsOn" "project:orion"
add_assertion "project:nova" "dependsOn" "project:apollo"

echo
echo "Demo dataset seeded successfully."
echo "Open $BASE/graph and refresh the graph."
echo "Ontology: $ONTOLOGY_ID"
