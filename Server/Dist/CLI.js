"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = require("readline");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = require("path");
const util_1 = require("util");
const Server_1 = require("./Server");
const ShellPath = (...Paths) => `"${path_1.resolve(...Paths)}"`;
class CLIController {
    constructor() {
        this.Controller = new Controller();
        this.Services = {};
        this.LastPort = 17474;
        this.Running = false;
    }
    Ask(Question) {
        return new Promise(R => this.CLInterface.question(`${Question}: `, R));
    }
    Prompt() {
        return new Promise(R => {
            this.CLInterface.once("line", R);
            this.CLInterface.prompt();
        });
    }
    Write(Data) {
        const Type = typeof Data;
        switch (Type) {
            case "string":
                this.CLInterface.write("> " + Data);
                break;
            case "number":
            case "boolean":
            case "symbol":
            case "function":
                this.CLInterface.write("> " + Data.toString());
                break;
            case "undefined":
                this.CLInterface.write("> undefined");
                break;
            default:
                this.CLInterface.write("> " + util_1.inspect(Data));
                break;
        }
    }
    WriteLn(Data) {
        this.Write(Data);
        this.CLInterface.write("\n");
    }
    ExecB(Command, Grep) {
        if (Grep)
            Command += ` | grep ${Grep}`;
        return new Promise((R, E) => {
            child_process_1.exec(Command, (Error, StdOut, StdErr) => {
                if (Error)
                    E(`${Error}: ${StdErr}`);
                else
                    R(StdOut);
            });
        });
    }
    async Confirm(Question) {
        for (;;) {
            const Answer = (await this.Ask(`${Question} [yes|no]>`)).toLowerCase();
            if (Answer == "yes")
                return true;
            else if (Answer == "no")
                return false;
            CLI.WriteLn("Not a valid answer!");
        }
    }
    async Run() {
        await this.Init();
        this.CLInterface = readline_1.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "Empati# "
        });
        this.Running = true;
        for (; this.Running;) {
            const Raw = await this.Prompt();
            if (Raw == "" || Raw.startsWith("> "))
                continue;
            const Command = Raw.trim().split(" ");
            const Fn = Command.shift();
            if (Fn in this.Controller)
                this.Controller[Fn].apply(this.Controller, Command);
            else {
                const AlternateFn = Fn.toLowerCase();
                if (AlternateFn in this.Controller)
                    CLI.WriteLn(`Did you mean "${AlternateFn}"?`);
                else
                    CLI.WriteLn("Couldn't find function!");
            }
        }
        this.CLInterface.close();
        process.exit(0);
    }
    async Init() {
        this.MakeSureDir("Projects");
        this.MakeSureDir("Backups");
        this.MakeSureDir("Logs");
        this.MakeSureDir("Configs");
    }
    MakeSureDir(Path) {
        if (!fs_1.existsSync(Path))
            fs_1.mkdirSync(Path);
    }
}
class Controller {
    ls() {
        const Dir = fs_1.readdirSync("Projects");
        CLI.WriteLn(Dir);
    }
    async delete(Name, Force = false) {
        if (!Name && !(Name = CLI.CurrentProject))
            return CLI.WriteLn("No project selected!");
        const Reset = Force || await CLI.Confirm("Do you really wanna delete this project?");
        if (!Reset)
            return CLI.WriteLn("Aborted.");
        CLI.WriteLn(await CLI.ExecB(`rm -rf ${path_1.resolve(`Projects/${Name}`)}`));
        CLI.WriteLn(await CLI.ExecB(`rm -rf ${path_1.resolve(`Configs/${Name}`)}`));
        CLI.WriteLn(await CLI.ExecB(`rm -rf ${path_1.resolve(`Logs/${Name}`)}`));
        this.root();
    }
    root() {
        CLI.CurrentProject = undefined;
        CLI.CLInterface.setPrompt(`Empati# `);
    }
    async init(Name) {
        if (!Name)
            Name = await CLI.Ask("Project Name");
        const Dir = path_1.resolve("Projects", Name);
        const Exists = fs_1.existsSync(Dir);
        if (Exists) {
            const Reset = await CLI.Confirm("Project already exists. Do you wanna reset it?");
            if (!Reset)
                return CLI.WriteLn("Project already exists!");
            await this.delete(Name, true);
        }
        CLI.MakeSureDir(path_1.resolve("Logs", Name));
        CLI.MakeSureDir(path_1.resolve("Configs", Name));
        fs_1.mkdirSync(Dir);
        fs_1.mkdirSync(path_1.resolve(Dir, "Source"));
        fs_1.copyFileSync("Client/tsconfig.json", path_1.resolve(Dir, "tsconfig.json"));
        await CLI.ExecB(`ln -s ${ShellPath("Client", "Source")} ${ShellPath("Projects", Name, "Source", "Lib")}`);
        await CLI.ExecB(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout ${ShellPath("Configs", Name, "CertPrivate.key")} -out ${ShellPath("Configs", Name, "Cert.pem")}`);
        CLI.WriteLn(`Project initialized: ${Name}`);
    }
    async select(Name) {
        if (!Name)
            Name = await CLI.Ask("Project Name");
        const Exists = fs_1.existsSync(`Projects/${Name}`);
        if (!Exists) {
            const New = await CLI.Confirm("Project couldn't be found. Do you wanna create it?");
            if (New)
                await this.init(Name);
        }
        CLI.CurrentProject = Name;
        CLI.CLInterface.setPrompt(`${CLI.CurrentProject}$ `);
        CLI.WriteLn(`Current project: ${Name}.`);
    }
    async create(Name) {
        if (!Name)
            Name = await CLI.Ask("Project Name");
        const Exists = fs_1.existsSync(`Projects/${Name}`);
        if (Exists) {
            const Reset = await CLI.Confirm("Project already exists. Do you wanna backup old one and reset it?");
            if (Reset) {
                await this.backup(Name);
                await this.delete(Name, true);
                await this.init(Name);
            }
        }
        else
            await this.init(Name);
        CLI.WriteLn(`Project created: ${Name}`);
    }
    async run(Name) {
        if (!Name && !(Name = CLI.CurrentProject))
            return CLI.WriteLn("No project selected!");
        const TypescriptCompiler = child_process_1.spawn("tsc", [], {
            cwd: path_1.resolve("Projects", Name)
        });
        const Server = new Server_1.default(Name);
        const Port = CLI.LastPort++;
        Server.Server.listen(Port);
        CLI.Services[Name] = { TypescriptCompiler, Server };
        TypescriptCompiler.stdout.pipe(fs_1.createWriteStream(path_1.resolve("Logs", Name, `tsc-${Date.now()}`)));
        TypescriptCompiler.stderr.pipe(fs_1.createWriteStream(path_1.resolve("Logs", Name, `tsc-err-${Date.now()}`)));
        CLI.WriteLn(`Project running: ${Name} @localhost:${Port}`);
    }
    async kill(Name) {
        if (!Name && !(Name = CLI.CurrentProject))
            return CLI.WriteLn("No project selected!");
        if (!(Name in CLI.Services))
            return CLI.WriteLn(`${Name} is not running!`);
        const Service = CLI.Services[Name];
        Service.Server.Server.close();
        Service.TypescriptCompiler.kill("SIGKILL");
        delete CLI.Services[Name];
        CLI.WriteLn(`Project killed: ${Name}`);
    }
    async edit(Name) {
        if (!Name && !(Name = CLI.CurrentProject))
            return CLI.WriteLn("No project selected!");
        const Editor = child_process_1.spawn(`code`, [ShellPath("Projects", Name)], {
            shell: true
        });
    }
    async backup(Name) {
        if (!Name && !(Name = CLI.CurrentProject))
            return CLI.WriteLn("No project selected!");
        await CLI.ExecB(`cp -a ${ShellPath("Projects", Name, ".")} ${ShellPath("Backups", Name + Date.now())}`);
    }
    exit() {
        CLI.Running = false;
    }
    ps() {
        CLI.WriteLn(Object.keys(CLI.Services));
    }
}
const CLI = new CLIController();
CLI.Run();
