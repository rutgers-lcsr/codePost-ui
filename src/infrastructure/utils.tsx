function addToPayload<T>(payload : { [id: string] : any; }, key : string, value : T | undefined) {
  if (typeof value !== 'undefined') {
    payload[key] = value;
  }
  return payload;
}

export { addToPayload };
