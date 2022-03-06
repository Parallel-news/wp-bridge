import axios from "axios";
import { red } from "../bin/colors.js";

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

export async function isWordpress(domain_url) {
  try {
    const dotIndex = domain_url.indexOf(".");
    if (dotIndex === -1) {
      console.log(red(`ERROR: ${domain_url} is not a valid domain format`));
      process.exit(1);
    }
    const domain = domain_url.split(".");
    const url = `https://${domain[0]}.${domain[1]}`;
    const request_url = `${url}/wp-json/wp/v2/posts/`;

    const request = await axios.get(request_url);
    const isWordpress = String(
      request.headers?.["access-control-expose-headers"]
    ).includes("WP")
      ? true
      : false;

    return isWordpress;
  } catch (error) {
    return false;
  }
}
