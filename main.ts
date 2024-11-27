import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import { Confirm } from "@cliffy/prompt/confirm";
import { exists, walk } from "@std/fs";

const error = colors.bold.red;
const warn = colors.bold.yellow;
const info = colors.bold.blue;
const done = colors.bold.green;

await new Command()
  .name("gino")
  .version("0.1.0")
  .description("CLI tool for downloading .gitignore")
  .option("-o, --output <path>", "Change the output path of .gitignore.")
  .option("--no-write", "Print the .gitignore instead of to write")
  .arguments("<laguage>")
  .action(generateGitignoreHandler)
  .command("list", "list language from gitignore.io")
  .action(async () => {
    const languageList = await listLanguage();
    console.log(languageList.join("\n"));
  })
  .parse(Deno.args);

async function generateGitignoreHandler({ output, write }, language: string) {
  const path = output ? output : ".gitignore";

  const gitignoreExists = await exists(path);
  if (gitignoreExists && write) {
    const confirmed: boolean = await Confirm.prompt(
      ".gitignore is already exists. Do you want to override it?",
    );
    if (!confirmed) {
      console.log(info("INFO"), ".gitignore generation was cancelled.");
      return;
    }
  }

  const gitignore = await getGitignore(language);
  if (gitignore === null) {
    console.log(error("ERROR"), `Language ${language} was not found`);
    return;
  }

  console.log(
    info("INFO"),
    "Downloading .gitignore of",
    language,
    "from gitignore.io",
  );

  if (write) {
    console.log(info("INFO"), "Write .gitignore");
    Deno.writeTextFile(path, gitignore);
  } else {
    console.log(info("INFO"), "Print .gitignore");
    console.log(gitignore);
  }

  console.log(done("DONE"));
}

async function getGitignore(language: string): Promise<string | null> {
  const response = await fetch(`https://gitignore.io/api/${language}`);
  if (response.status === 404) {
    return null;
  }
  return await response.text();
}

async function listLanguage(): Promise<string[]> {
  const response = await fetch("https://gitignore.io/api/list");
  const text = await response.text();
  const languageList = text
    .replace("\n", ",")
    .split(",");
  return languageList;
}
