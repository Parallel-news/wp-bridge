import figlet from "figlet";
import chalk from "chalk";
import CLI from "clui";
const { Spinner } = CLI;

export async function initer() {
  return figlet("WP - Bridge", function (err, greeting) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(`\n` + greeting);
    console.log(`[*] developed by: PermawebDAO`);
    console.log(`[*] github: https://github.com/parallel-news/wp-bridge`);
    console.log(`[*] Twitter: @ArweaveNews \n\n`);
  });
}

export const spinnerStyle = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];

export function spinner(message) {
  const spinner = new Spinner(message, spinnerStyle);

  return spinner;
}
