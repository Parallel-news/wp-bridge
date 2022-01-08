export function checkFileExtension(path, extension) {
  const pathArray = path.split(".");
  const expectedExtensionIndex = pathArray.length - 1;
  const isJson = pathArray[expectedExtensionIndex] === extension ? true : false;

  return isJson;
}

export function isParsable(stringified) {
  try {
    JSON.parse(stringified);

    return true;
  } catch (error) {
    return false;
  }
}
