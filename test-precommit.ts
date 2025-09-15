// This file has intentional formatting issues to test the pre-commit hook
const testFunction = (param1: string, param2: number) => {
  if (param1 === 'test') {
    return param2 * 2
  } else {
    return 0
  }
}

export default testFunction
