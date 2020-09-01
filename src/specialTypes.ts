// @ts-nocheck
import { values as v, Expr } from "faunadb";

const ctors = {
  classes: "Class",
  collections: "Collection",
  indexes: "Index",
  databases: "Database",
  keys: "Key",
  roles: "Role",
};

const parseRef = (obj) => {
  if (obj === undefined) {
    return obj;
  } else if (obj instanceof v.Ref) {
    return obj;
  } else {
    const ref = "@ref" in obj ? obj["@ref"] : obj;
    return new v.Ref(ref.id, parseRef(ref.collection), parseRef(ref.database));
  }
};

const renderRef = (obj) => {
  let args = [`"${obj.id}"`];

  if (obj.collection !== undefined) {
    const ctor = ctors[obj.collection.id];
    if (ctor !== undefined) {
      if (obj.database !== undefined) args.push(renderRef(obj.database));
      args = args.join(", ");
      return `${ctor}(${args})`;
    }
  }

  if (obj.collection !== undefined)
    args = [renderRef(obj.collection)].concat(args);
  args = args.join(", ");
  return `Ref(${args})`;
};

export const renderSpecialType = (type) => {
  if (!type) return null;

  if (type instanceof v.Value) {
    if (type instanceof v.Ref) return renderRef(type);
    if (type instanceof v.FaunaTime) return `Time("${type.value}")`;
    if (type instanceof v.FaunaDate) return `Date("${type.value}")`;
    if (type instanceof v.Query) return `Query(${Expr.toString(type.value)})`;
    return null;
  }

  if (typeof type === "object" && !Array.isArray(type)) {
    const keys = Object.keys(type);

    switch (keys[0]) {
      case "@ref":
        return renderRef(parseRef(type));
      case "@ts":
        return renderSpecialType(new v.FaunaTime(type["@ts"]));
      case "@date":
        return renderSpecialType(new v.FaunaDate(type["@date"]));
      case "@code":
        return type["@code"];
      case "@query":
        return renderSpecialType(new v.Query(type["@query"]));
      default:
        return null;
    }
  }

  return null;
};
