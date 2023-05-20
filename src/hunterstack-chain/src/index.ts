/** used for returning something from an if, else if, else statement without nasty ternaries */
export type ChainIf<ArgType> = {
  else: (value: ArgType | (() => ArgType)) => ArgType;
  elseIf: (nextPredicate: any, nextValueIfTrue: ArgType | (() => ArgType)) => ChainIf<ArgType>;
  get: () => ArgType | undefined;
};
export function chainIf<T>(
  predicate: boolean | any,
  valueIfTrue: T | (() => T)
): ChainIf<T> {
  return _if(predicate, valueIfTrue, { reachedTrue: false });
}

function _if<ArgType>(
  predicate: boolean | any,
  valueIfTrue: ArgType | (() => ArgType),
  state: { reachedTrue: false } | { reachedTrue: true; value: ArgType }
): ChainIf<ArgType> {
  const newState =
    predicate && !state.reachedTrue
      ? {
          value: valueIfTrue instanceof Function ? valueIfTrue() : valueIfTrue,
          reachedTrue: true,
        }
      : state;

  const elseIf = (
    nextPredicate: boolean | any,
    nextValueIfTrue: ArgType | (() => ArgType)
  ) => {
    return _if(nextPredicate, nextValueIfTrue, newState);
  };
  const elseFunc = (value: ArgType | (() => ArgType)): ArgType => {
    if (!newState.reachedTrue)
      return value instanceof Function ? value() : value;
    return newState.value;
  };
  return {
    else: elseFunc,
    elseIf,
    get: () => (state.reachedTrue ? state.value : undefined),
  };
}

export type ChainCase<ArgType, RT> = {
  default: <AdditionalType>(
    nextValue: AdditionalType | ((value: ArgType) => AdditionalType)
  ) => Exclude<AdditionalType | RT, null>;
  case: <AdditionalType>(
    nextPredicate: ArgType | ((value: ArgType) => boolean),
    nextValueIfTrue: AdditionalType | ((value: ArgType) => AdditionalType)
  ) => ChainCase<ArgType, AdditionalType>;
};

/** used for returning something from a switch case */
export function chainCase<ArgType>(value: ArgType): ChainCase<ArgType, null> {
  return _case(value, () => false, { reachedTrue: false });
}

function _case<ArgType, ResultType>(
  value: ArgType,
  predicate: ((value: ArgType) => boolean) | ArgType,
  state: { reachedTrue: false } | { reachedTrue: true; value: any },
  valueIfTrue?: ((value: ArgType) => ResultType) | ResultType
): ChainCase<ArgType, null> {
  const predicateValue =
    predicate instanceof Function ? predicate(value) : value === predicate;
  const newState =
    predicateValue && !state.reachedTrue
      ? {
          value:
            valueIfTrue instanceof Function ? valueIfTrue(value) : valueIfTrue,
          reachedTrue: true,
        }
      : state;

  return {
    default: (nextValue) => {
      if (!newState.reachedTrue)
        return nextValue instanceof Function ? nextValue(value) : nextValue;
      return newState.value;
    },
    case: (nextPredicate, nextValueIfTrue) => {
      return _case(value, nextPredicate, newState, nextValueIfTrue);
    },
  };
}
