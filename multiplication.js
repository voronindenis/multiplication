class Either {
  constructor(x) {
    this.$value = x;
  }

  // ----- Pointed (Either a)
  static of(x) {
    return new Right(x);
  }
}

class Left extends Either {
  get isLeft() {
    return true;
  }

  get isRight() {
    return false;
  }

  static of(x) {
    throw new Error('`of` called on class Left (value) instead of Either (type)');
  }

  // ----- Functor (Either a)
  map() {
    return this;
  }

  // ----- Applicative (Either a)
  ap() {
    return this;
  }

  // ----- Monad (Either a)
  chain() {
    return this;
  }

  join() {
    return this;
  }

  // ----- Traversable (Either a)
  sequence(of) {
    return of(this);
  }

  traverse(of, fn) {
    return of(this);
  }
}

const left = x => new Left(x);

class Right extends Either {
  get isLeft() {
    return false;
  }

  get isRight() {
    return true;
  }

  static of(x) {
    throw new Error('`of` called on class Right (value) instead of Either (type)');
  }

  // ----- Functor (Either a)
  map(fn) {
    return Either.of(fn(this.$value));
  }

  // ----- Applicative (Either a)
  ap(f) {
    return f.map(this.$value);
  }

  // ----- Monad (Either a)
  chain(fn) {
    return fn(this.$value);
  }

  join() {
    return this.$value;
  }

  // ----- Traversable (Either a)
  sequence(of) {
    return this.traverse(of, identity);
  }

  traverse(of, fn) {
    fn(this.$value).map(Either.of);
  }
}

// compose :: ((a -> b), (b -> c),  ..., (y -> z)) -> a -> z
const compose = (...fns) => (...args) => fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0];

// curry :: ((a, b, ...) -> c) -> a -> b -> ... -> c
function curry(fn) {
  const arity = fn.length;

  return function $curry(...args) {
    if (args.length < arity) {
      return $curry.bind(null, ...args);
    }

    return fn.call(null, ...args);
  };
}

// either :: (a -> c) -> (b -> c) -> Either a b -> c
const either = curry((f, g, e) => {
  if (e.isLeft) {
    return f(e.$value);
  }

  return g(e.$value);
});

// identity :: x -> x
const identity = x => x;

const trace = curry((tag, x) => {
  console.log(tag, x);
  return x;
});

// stringToArray :: String -> [String]
const stringToArray = (str) => str.split('');

// reverse :: [a] -> [b]
const reverse = (a) => [...a].reverse();

// join :: [a] -> String
const join = (a) => a.join('');

// sliceByIndex :: [a] -> [b]
const sliceByIndex = curry((a, i) => a.slice(i));

// findFirstNatureNumIndex :: [a] -> Number
const findFirstNatureNumIndex = (a) => a.findIndex(el => el !== '0');

// sliceFromIndex :: [a] -> [a]
const sliceFromIndex = curry((f, fn, a) => compose(f(a), fn)(a));

// sliceFromIndex :: [a] -> [a]
const compactNum = sliceFromIndex(sliceByIndex, findFirstNatureNumIndex);

// getCompactNum :: [a] -> [a]
const getCompactNum = compose(reverse, compactNum, stringToArray);

// applyIfIsNotZero :: a -> Either(a, a)
const applyIfIsNotZero = curry((val) => (
 val !== '0' ? Either.of(val): left(val)
));

// getArrFromStrNum :: String -> [String]
const getArrFromStrNum = compose(
  either(identity, getCompactNum), applyIfIsNotZero
);

// applyIfIsArrays :: a -> b -> Either({a, b}, a)
const applyIfIsArrays = curry((arrA, arrB) => {
 if (arrA === '0') {
     return left(arrA)
   }
   if (arrB === '0') {
     return left(arrB)
   }
 return Either.of({ arrA, arrB })
})

// multiplyArrays :: {[a], [b]} -> [c]
const multiplyArrays = curry((arrays) => {
  const { arrA, arrB } = arrays;
  return arrA.reduce(
    (acc, elA, i) => {
       arrB.forEach((elB, j) => {
       const n = elA * elB;
        acc[i + j] = (acc[i + j]) ? acc[i + j] + n : n;
     })
     return acc;
  }, [])
});

// getMultipliedArray :: ([a], [b]) -> Either([c], _)
const getMultipliedArray = compose(either(identity, multiplyArrays), applyIfIsArrays);

// mapMultipliedArray :: [Number] -> [Number]
const mapMultipliedArray = (arr) => {
  const stack = [...arr];
  for (var i = 0; i < stack.length; i++) {
    var num = stack[i] % 10;
    var move = Math.floor(stack[i] / 10);
    stack[i] = num;
    if (stack[i + 1])
      stack[i + 1] += move;
    else if (move != 0)
      stack[i + 1] = move;
  }
  return stack;
};

// getMultipliedNumber :: [String] -> string
const getMultipliedNumber = compose(join , reverse, either(identity, mapMultipliedArray), applyIfIsNotZero);

const multiply = (a, b) => getMultipliedNumber(
  getMultipliedArray(getArrFromStrNum(a), getArrFromStrNum(b))
);

console.log(multiply("30", "69")) // "2070"

console.log(multiply("1009", "03")) // "3027"
console.log(multiply("2" ,"0")) // "0"
console.log(multiply("0", "30")) // "0"
console.log(multiply("0000001", "3")) // "3"

console.log(multiply("98765", "56894")); // "5619135910"
console.log(multiply("1020303004875647366210", "2774537626200857473632627613")) // "2830869077153280552556547081187254342445169156730"
console.log(multiply("58608473622772837728372827", "7586374672263726736374")) // "444625839871840560024489175424316205566214109298"
console.log(multiply("9007199254740991", "9007199254740991")) // "81129638414606663681390495662081"
