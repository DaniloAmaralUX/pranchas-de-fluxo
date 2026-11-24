import {execFileSync} from "node:child_process";
import {existsSync,mkdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("../.agents/fontes/",import.meta.url));
const sources = [
  {repo:"mattpocock/skills",folder:"mattpocock-skills",revision:"abeeaf95660ba9e8b7c753eb38f441ca707a8823"},
  {repo:"ncdai/chanhdai.com",folder:"chanhdai.com",revision:"7d44f44c7225c007831f9110e673c58290c3dca9"},
];
const git = (folder,...args) => execFileSync("git",["-C",folder,...args],{encoding:"utf8"}).trim();

try {
  mkdirSync(root,{recursive:true});
  for (const {repo,folder,revision} of sources) {
    const destination=path.join(root,folder);
    if (!existsSync(destination)) {
      execFileSync("gh",["repo","clone",repo,destination,"--","--filter=blob:none","--no-checkout"],{stdio:"inherit"});
      execFileSync("git",["-C",destination,"switch","--detach",revision],{stdio:"inherit"});
    }
    const origin = git(destination,"remote","get-url","origin")
      .replace(/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)/i,"")
      .replace(/\.git$/i,"");
    if (origin.toLowerCase() !== repo.toLowerCase() || git(destination,"rev-parse","HEAD") !== revision) {
      throw Error("Origem ou revisão divergente em " + folder + ". Preserve o clone atual e confira a revisão indicada em docs/repositorio.md.");
    }
    console.log(repo + " " + revision);
  }
} catch(error) {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
}
