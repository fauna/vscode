declare module 'faunadb/src/_json' {
  export function toJSON(value: object): string;
  export function parseJSON(value: string): object;
}

declare module 'highlight.js/lib/languages/javascript' {
  export = Object;
}
