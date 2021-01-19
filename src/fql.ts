import { Client, query } from "faunadb";
import { renderSpecialType } from './specialTypes';
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


function parseQueries(code: string): string[] {
  const brackets: Record<string, string> = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      '\'': '\'',
  }
  const openBrackets = new Set(Object.keys(brackets))
  const closeBrackets = new Set(Object.values(brackets))
  const queries = [];
  const stack = [];
  let start = 0;
  let isOpening;
  code = code.trim();

  for (let i = 0; i < code.length; i++) {
      if(openBrackets.has(code[i])){
          stack.push(code[i]);
          isOpening = true;
      }

      if(closeBrackets.has(code[i]) && brackets[stack.pop()!] !== code[i]){
          throw new Error(`Unexpected closing bracket ${code[i]} at position: ${i + 1}`)
      }

      if(stack.length === 0 && isOpening) {
        queries.push(code.slice(start, i + 1));
          start = i + 1;
          isOpening = false;
      }
  }
  return queries;
}

export function runFQLQuery(code: string, client: Client) {
  try {
    const queriesArray = parseQueries(code)
    if(queriesArray.length === 0) {
      return Promise.reject('Invalid query')
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
