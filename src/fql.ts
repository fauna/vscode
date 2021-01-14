import { query, Client } from "faunadb";
import {renderSpecialType} from './specialTypes'
const prettier = require("prettier/standalone");
const plugins = [require("prettier/parser-babylon")];

export function evalFQLCode(code: string) {
  return baseEvalFQL(code, query);
}

function baseEvalFQL(fql: string, q: typeof query) {
  const {
    Ref,
    Bytes,
    Abort,
    At,
    Let,
    Var,
    If,
    Do,
    Object,
    Lambda,
    Call,
    Query,
    Map,
    Foreach,
    Filter,
    Take,
    Drop,
    Prepend,
    Append,
    IsEmpty,
    IsNonEmpty,
    Get,
    KeyFromSecret,
    Paginate,
    Exists,
    Create,
    Update,
    Replace,
    Delete,
    Insert,
    Remove,
    CreateClass,
    CreateCollection,
    CreateDatabase,
    CreateIndex,
    CreateKey,
    CreateFunction,
    CreateRole,
    Singleton,
    Events,
    Match,
    Union,
    Intersection,
    Difference,
    Distinct,
    Join,
    Login,
    Logout,
    Identify,
    Identity,
    HasIdentity,
    Concat,
    Casefold,
    FindStr,
    FindStrRegex,
    Length,
    LowerCase,
    LTrim,
    NGram,
    Repeat,
    ReplaceStr,
    ReplaceStrRegex,
    RTrim,
    Space,
    SubString,
    TitleCase,
    Trim,
    UpperCase,
    Time,
    Epoch,
    Date,
    NextId,
    NewId,
    Database,
    Index,
    Class,
    Collection,
    Function,
    Role,
    Classes,
    Collections,
    Databases,
    Indexes,
    Functions,
    Roles,
    Keys,
    Tokens,
    Credentials,
    Equals,
    Contains,
    Select,
    SelectAll,
    Abs,
    Add,
    BitAnd,
    BitNot,
    BitOr,
    BitXor,
    Ceil,
    Divide,
    Floor,
    Max,
    Min,
    Modulo,
    Multiply,
    Round,
    Subtract,
    Sign,
    Sqrt,
    Trunc,
    Acos,
    Asin,
    Atan,
    Cos,
    Cosh,
    Degrees,
    Exp,
    Hypot,
    Ln,
    Log,
    Pow,
    Radians,
    Sin,
    Sinh,
    Tan,
    Tanh,
    LT,
    LTE,
    GT,
    GTE,
    And,
    Or,
    Not,
    ToString,
    ToNumber,
    ToTime,
    ToSeconds,
    ToMicros,
    ToMillis,
    DayOfMonth,
    DayOfWeek,
    DayOfYear,
    Second,
    Minute,
    Hour,
    Month,
    Year,
    ToDate,
    Format,
    Merge,
    Range,
    Reduce,
    MoveDatabase,
    Count,
    Mean,
    Sum,
    StartsWith,
    EndsWith,
    ContainsStr,
    ContainsStrRegex,
    RegexEscape,
    Now,
    ToDouble,
    ToInteger,
    ToObject,
    ToArray,
    Any,
    All,
    TimeAdd,
    TimeSubtract,
    TimeDiff,
    IsNumber,
    IsDouble,
    IsInteger,
    IsBoolean,
    IsNull,
    IsBytes,
    IsTimestamp,
    IsDate,
    IsString,
    IsArray,
    IsObject,
    IsRef,
    IsSet,
    IsDoc,
    IsLambda,
    IsCollection,
    IsDatabase,
    IsIndex,
    IsFunction,
    IsKey,
    IsToken,
    IsCredentials,
    IsRole,
    Documents,
    Reverse,
    ContainsPath,
    ContainsField,
    ContainsValue,
    CreateAccessProvider,
    AccessProvider,
    AccessProviders,
    CurrentIdentity,
    HasCurrentIdentity,
    CurrentToken,
    HasCurrentToken,
  } = q;

  // eslint-disable-next-line
  return fql.match(/^\s*{(.*\n*)*}\s*$/) ? eval(`(${fql})`) : eval(fql);
}

function splitQueries(code: string) {
  const queries: string[] = [];

  code = code.trim();

  let start = 0; // Start of next query
  let opens = 0; // Number of unclosed expressions
  let quote = null; // The unclosed quote symbol

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      if (ch == quote && code[i - 1] != '\\') {
        quote = null;
      } else {
        continue;
      }
    } else if (ch == "'" || ch == '"') {
      quote = ch;
      continue;
    }
    if (ch == '(' || ch == '{' || ch == '[') {
      opens += 1;
    } else if (ch == ')' || ch == '}' || ch == ']') {
      opens -= 1;

      if (opens == 0) {
        queries.push(code.slice(start, i + 1));
        while (/\s/.test(code[++i])) {}
        start = i;
      }
    }
  }

  return queries;
}

export function runFQLQuery(code: string, client: Client) {
  try {
    const queriesArray = splitQueries(code);
    if (!queriesArray.length) {
      return Promise.reject('Invalid query.');
    }

    const wrappedQueries = queriesArray.map(query => {
      return client.query(evalFQLCode(query))
    })

    return Promise.all(wrappedQueries).then(results => {
      console.log("results", results);
      return results
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function stringify(obj: object) {
    const replacements: string[] = [];

    let string = JSON.stringify(
      obj,
      (key, value) => {
        const parsed = renderSpecialType(value);

        if (parsed) {
          const placeHolder =
            "$$dash_replacement_$" + replacements.length + "$$";
          replacements.push(parsed);
          return placeHolder;
        }

        return value;
      },
      2
    );

    replacements.forEach((replace, index) => {
      string = string.replace('"$$dash_replacement_$' + index + '$$"', replace);
    });

    if (string) {
      string = string.replace(/\(null\)/g, "()");
    }

    return string;
}

export function formatFQLCode(code: object | string): string {
  if (typeof code === "object") {
    code = stringify(code);
  }

  try {
    return prettier
      .format(`(${code})`, {
        parser: "babel",
        plugins,
      })
      .trim()
      .replace(/^(\({)/, "{")
      .replace(/(}\);$)/g, "}")
      .replace(";", "");
  } catch (error) {
    return code;
  }
}
