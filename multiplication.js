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

// stringToArray :: String -> [String]
const stringToArray = (str) => str.split('');

// reverse :: [a] -> Either([a], _)
const reverse = (a) => Array.isArray(a) ? Either.of(a.reverse()).join() : left(a).$value;

// join :: [a] -> Either(a, _)
const join = (a) => Array.isArray(a) ? Either.of(a.join('')).join() : left(a).$value;

// sliceByIndex :: [a] -> Number -> Either(a, _)
const sliceByIndex = curry((a, i) => Array.isArray(a) ? Either.of(a.slice(i)).join() : left(a).$value);

// findFirstNatureNumIndex :: [a] -> Number
const findFirstNatureNumIndex = (a) => a.findIndex(el => el !== '0');

// sliceFromIndex :: [a] -> [a]
const sliceFromIndex = curry((f, fn, a) => compose(f(a), fn)(a));

// sliceFromIndex :: [a] -> [a]
const compactNum = sliceFromIndex(sliceByIndex, findFirstNatureNumIndex);

// getCompactNum :: [a] -> [a]
const getCompactNum = compose(reverse, compactNum, stringToArray)

// applyIfIsNotZero :: a -> fn -> b -> Either(fn(b), b)
const applyIfIsNotZero = curry((val, fn, otherVal) => (
	val !== otherVal ? Either.of(fn(otherVal)).join() : left(otherVal).$value
));

// getArrNum :: String -> [String]
const getArrNum = applyIfIsNotZero('0', getCompactNum);

// applyIfIsArrays :: fn -> a -> b -> Either(fn(a, b), a)
const applyIfIsArrays = curry((fn, arrA, arrB) => {
	if (arrA === '0') {
	    return left(arrA).$value
	  }
	  if (arrB === '0') {
	    return left(arrB).$value
	  }
	return Either.of(fn(arrA, arrB)).join()
})

// multiplyArr :: [a] -> [b] -> [c]
const multiplyArr = curry((arrA, arrB) => arrA.reduce((acc, elA, i) =>{
	arrB.forEach((elB, j) => {
  	const n = elA * elB;
    acc[i + j] = (acc[i + j]) ? acc[i + j] + n : n;
  })
  return acc;
}, []));

// getMultipliedArr :: a -> b -> fn -> Either(fn(a, b), a)
const getMultipliedArr = applyIfIsArrays(multiplyArr);

// mapMultipliedArr :: [Number] -> [Number]
const mapMultipliedArr = (arr) => {
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
}

// getMappedMultipliedArr :: a -> fn -> b -> Either(fn(b), b)
const getMappedMultipliedArr = applyIfIsNotZero('0', mapMultipliedArr);

// getMultipliedNum :: [String] -> string
const getMultipliedNum = compose(join , reverse, getMappedMultipliedArr);

const multiply = (a, b) => getMultipliedNum(getMultipliedArr(getArrNum(a), getArrNum(b)))

console.log(multiply("30", "69")) // "2070"

console.log(multiply("1009", "03")) // "3027"
console.log(multiply("2" ,"0")) // "0"
console.log(multiply("0", "30")) // "0"
console.log(multiply("0000001", "3")) // "3"

console.log(multiply("98765", "56894")); // "5619135910"
console.log(multiply("1020303004875647366210", "2774537626200857473632627613")) // "2830869077153280552556547081187254342445169156730"
console.log(multiply("58608473622772837728372827", "7586374672263726736374")) // "444625839871840560024489175424316205566214109298"
console.log(multiply("9007199254740991", "9007199254740991")) // "81129638414606663681390495662081"