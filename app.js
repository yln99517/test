var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("vfs", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const hasLocalStorage = typeof localStorage !== `undefined`;
    const hasProcess = typeof process !== `undefined`;
    const shouldDebug = (hasLocalStorage && localStorage.getItem("DEBUG")) || (hasProcess && process.env.DEBUG);
    const debugLog = shouldDebug ? console.log : (_message, ..._optionalParams) => "";
    /**
     * Makes a virtual copy of the TypeScript environment. This is the main API you want to be using with
     * @typescript/vfs. A lot of the other exposed functions are used by this function to get set up.
     *
     * @param sys an object which conforms to the TS Sys (a shim over read/write access to the fs)
     * @param rootFiles a list of files which are considered inside the project
     * @param ts a copy pf the TypeScript module
     * @param compilerOptions the options for this compiler run
     */
    function createVirtualTypeScriptEnvironment(sys, rootFiles, ts, compilerOptions = {}) {
        const mergedCompilerOpts = Object.assign(Object.assign({}, defaultCompilerOptions(ts)), compilerOptions);
        const { languageServiceHost, updateFile } = createVirtualLanguageServiceHost(sys, rootFiles, mergedCompilerOpts, ts);
        const languageService = ts.createLanguageService(languageServiceHost);
        const diagnostics = languageService.getCompilerOptionsDiagnostics();
        if (diagnostics.length) {
            const compilerHost = createVirtualCompilerHost(sys, compilerOptions, ts);
            throw new Error(ts.formatDiagnostics(diagnostics, compilerHost.compilerHost));
        }
        return {
            sys,
            languageService,
            getSourceFile: fileName => { var _a; return (_a = languageService.getProgram()) === null || _a === void 0 ? void 0 : _a.getSourceFile(fileName); },
            createFile: (fileName, content) => {
                updateFile(ts.createSourceFile(fileName, content, mergedCompilerOpts.target, false));
            },
            updateFile: (fileName, content, optPrevTextSpan) => {
                const prevSourceFile = languageService.getProgram().getSourceFile(fileName);
                const prevFullContents = prevSourceFile.text;
                // TODO: Validate if the default text span has a fencepost error?
                const prevTextSpan = optPrevTextSpan !== null && optPrevTextSpan !== void 0 ? optPrevTextSpan : ts.createTextSpan(0, prevFullContents.length);
                const newText = prevFullContents.slice(0, prevTextSpan.start) +
                    content +
                    prevFullContents.slice(prevTextSpan.start + prevTextSpan.length);
                const newSourceFile = ts.updateSourceFile(prevSourceFile, newText, {
                    span: prevTextSpan,
                    newLength: content.length,
                });
                updateFile(newSourceFile);
            },
        };
    }
    exports.createVirtualTypeScriptEnvironment = createVirtualTypeScriptEnvironment;
    /**
     * Grab the list of lib files for a particular target, will return a bit more than necessary (by including
     * the dom) but that's OK
     *
     * @param target The compiler settings target baseline
     * @param ts A copy of the TypeScript module
     */
    exports.knownLibFilesForCompilerOptions = (compilerOptions, ts) => {
        const target = compilerOptions.target || ts.ScriptTarget.ES5;
        const lib = compilerOptions.lib || [];
        const files = [
            "lib.d.ts",
            "lib.dom.d.ts",
            "lib.dom.iterable.d.ts",
            "lib.webworker.d.ts",
            "lib.webworker.importscripts.d.ts",
            "lib.scripthost.d.ts",
            "lib.es5.d.ts",
            "lib.es6.d.ts",
            "lib.es2015.collection.d.ts",
            "lib.es2015.core.d.ts",
            "lib.es2015.d.ts",
            "lib.es2015.generator.d.ts",
            "lib.es2015.iterable.d.ts",
            "lib.es2015.promise.d.ts",
            "lib.es2015.proxy.d.ts",
            "lib.es2015.reflect.d.ts",
            "lib.es2015.symbol.d.ts",
            "lib.es2015.symbol.wellknown.d.ts",
            "lib.es2016.array.include.d.ts",
            "lib.es2016.d.ts",
            "lib.es2016.full.d.ts",
            "lib.es2017.d.ts",
            "lib.es2017.full.d.ts",
            "lib.es2017.intl.d.ts",
            "lib.es2017.object.d.ts",
            "lib.es2017.sharedmemory.d.ts",
            "lib.es2017.string.d.ts",
            "lib.es2017.typedarrays.d.ts",
            "lib.es2018.asyncgenerator.d.ts",
            "lib.es2018.asynciterable.d.ts",
            "lib.es2018.d.ts",
            "lib.es2018.full.d.ts",
            "lib.es2018.intl.d.ts",
            "lib.es2018.promise.d.ts",
            "lib.es2018.regexp.d.ts",
            "lib.es2019.array.d.ts",
            "lib.es2019.d.ts",
            "lib.es2019.full.d.ts",
            "lib.es2019.object.d.ts",
            "lib.es2019.string.d.ts",
            "lib.es2019.symbol.d.ts",
            "lib.es2020.d.ts",
            "lib.es2020.full.d.ts",
            "lib.es2020.string.d.ts",
            "lib.es2020.symbol.wellknown.d.ts",
            "lib.es2020.bigint.d.ts",
            "lib.es2020.promise.d.ts",
            "lib.esnext.array.d.ts",
            "lib.esnext.asynciterable.d.ts",
            "lib.esnext.bigint.d.ts",
            "lib.esnext.d.ts",
            "lib.esnext.full.d.ts",
            "lib.esnext.intl.d.ts",
            "lib.esnext.symbol.d.ts",
        ];
        const targetToCut = ts.ScriptTarget[target];
        const matches = files.filter(f => f.startsWith(`lib.${targetToCut.toLowerCase()}`));
        const targetCutIndex = files.indexOf(matches.pop());
        const getMax = (array) => array && array.length ? array.reduce((max, current) => (current > max ? current : max)) : undefined;
        // Find the index for everything in
        const indexesForCutting = lib.map(lib => {
            const matches = files.filter(f => f.startsWith(`lib.${lib.toLowerCase()}`));
            if (matches.length === 0)
                return 0;
            const cutIndex = files.indexOf(matches.pop());
            return cutIndex;
        });
        const libCutIndex = getMax(indexesForCutting) || 0;
        const finalCutIndex = Math.max(targetCutIndex, libCutIndex);
        return files.slice(0, finalCutIndex + 1);
    };
    /**
     * Sets up a Map with lib contents by grabbing the necessary files from
     * the local copy of typescript via the file system.
     */
    exports.createDefaultMapFromNodeModules = (compilerOptions) => {
        const ts = require("typescript");
        const path = require("path");
        const fs = require("fs");
        const getLib = (name) => {
            const lib = path.dirname(require.resolve("typescript"));
            return fs.readFileSync(path.join(lib, name), "utf8");
        };
        const libs = exports.knownLibFilesForCompilerOptions(compilerOptions, ts);
        const fsMap = new Map();
        libs.forEach(lib => {
            fsMap.set("/" + lib, getLib(lib));
        });
        return fsMap;
    };
    /**
     * Create a virtual FS Map with the lib files from a particular TypeScript
     * version based on the target, Always includes dom ATM.
     *
     * @param options The compiler target, which dictates the libs to set up
     * @param version the versions of TypeScript which are supported
     * @param cache should the values be stored in local storage
     * @param ts a copy of the typescript import
     * @param lzstring an optional copy of the lz-string import
     * @param fetcher an optional replacement for the global fetch function (tests mainly)
     * @param storer an optional replacement for the localStorage global (tests mainly)
     */
    exports.createDefaultMapFromCDN = (options, version, cache, ts, lzstring, fetcher, storer) => {
        const fetchlike = fetcher || fetch;
        const storelike = storer || localStorage;
        const fsMap = new Map();
        const files = exports.knownLibFilesForCompilerOptions(options, ts);
        const prefix = `https://typescript.azureedge.net/cdn/${version}/typescript/lib/`;
        function zip(str) {
            return lzstring ? lzstring.compressToUTF16(str) : str;
        }
        function unzip(str) {
            return lzstring ? lzstring.decompressFromUTF16(str) : str;
        }
        // Map the known libs to a node fetch promise, then return the contents
        function uncached() {
            return Promise.all(files.map(lib => fetchlike(prefix + lib).then(resp => resp.text()))).then(contents => {
                contents.forEach((text, index) => fsMap.set("/" + files[index], text));
            });
        }
        // A localstorage and lzzip aware version of the lib files
        function cached() {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                // Remove anything which isn't from this version
                if (key.startsWith("ts-lib-") && !key.startsWith("ts-lib-" + version)) {
                    storelike.removeItem(key);
                }
            });
            return Promise.all(files.map(lib => {
                const cacheKey = `ts-lib-${version}-${lib}`;
                const content = storelike.getItem(cacheKey);
                if (!content) {
                    // Make the API call and store the text concent in the cache
                    return fetchlike(prefix + lib)
                        .then(resp => resp.text())
                        .then(t => {
                        storelike.setItem(cacheKey, zip(t));
                        return t;
                    });
                }
                else {
                    return Promise.resolve(unzip(content));
                }
            })).then(contents => {
                contents.forEach((text, index) => {
                    const name = "/" + files[index];
                    fsMap.set(name, text);
                });
            });
        }
        const func = cache ? cached : uncached;
        return func().then(() => fsMap);
    };
    // TODO: Add some kind of debug logger (needs to be compat with sandbox's deployment, not just via npm)
    function notImplemented(methodName) {
        throw new Error(`Method '${methodName}' is not implemented.`);
    }
    function audit(name, fn) {
        return (...args) => {
            const res = fn(...args);
            const smallres = typeof res === "string" ? res.slice(0, 80) + "..." : res;
            debugLog("> " + name, ...args);
            debugLog("< " + smallres);
            return res;
        };
    }
    /** The default compiler options if TypeScript could ever change the compiler options */
    const defaultCompilerOptions = (ts) => {
        return Object.assign(Object.assign({}, ts.getDefaultCompilerOptions()), { jsx: ts.JsxEmit.React, strict: true, esModuleInterop: true, module: ts.ModuleKind.ESNext, suppressOutputPathCheck: true, skipLibCheck: true, skipDefaultLibCheck: true, moduleResolution: ts.ModuleResolutionKind.NodeJs });
    };
    // "/DOM.d.ts" => "/lib.dom.d.ts"
    const libize = (path) => path.replace("/", "/lib.").toLowerCase();
    /**
     * Creates an in-memory System object which can be used in a TypeScript program, this
     * is what provides read/write aspects of the virtual fs
     */
    function createSystem(files) {
        return {
            args: [],
            createDirectory: () => notImplemented("createDirectory"),
            // TODO: could make a real file tree
            directoryExists: audit("directoryExists", directory => {
                return Array.from(files.keys()).some(path => path.startsWith(directory));
            }),
            exit: () => notImplemented("exit"),
            fileExists: audit("fileExists", fileName => files.has(fileName) || files.has(libize(fileName))),
            getCurrentDirectory: () => "/",
            getDirectories: () => [],
            getExecutingFilePath: () => notImplemented("getExecutingFilePath"),
            readDirectory: audit("readDirectory", directory => (directory === "/" ? Array.from(files.keys()) : [])),
            readFile: audit("readFile", fileName => files.get(fileName) || files.get(libize(fileName))),
            resolvePath: path => path,
            newLine: "\n",
            useCaseSensitiveFileNames: true,
            write: () => notImplemented("write"),
            writeFile: (fileName, contents) => {
                files.set(fileName, contents);
            },
        };
    }
    exports.createSystem = createSystem;
    /**
     * Creates an in-memory CompilerHost -which is essentially an extra wrapper to System
     * which works with TypeScript objects - returns both a compiler host, and a way to add new SourceFile
     * instances to the in-memory file system.
     */
    function createVirtualCompilerHost(sys, compilerOptions, ts) {
        const sourceFiles = new Map();
        const save = (sourceFile) => {
            sourceFiles.set(sourceFile.fileName, sourceFile);
            return sourceFile;
        };
        const vHost = {
            compilerHost: Object.assign(Object.assign({}, sys), { getCanonicalFileName: fileName => fileName, getDefaultLibFileName: () => "/" + ts.getDefaultLibFileName(compilerOptions), 
                // getDefaultLibLocation: () => '/',
                getDirectories: () => [], getNewLine: () => sys.newLine, getSourceFile: fileName => {
                    return (sourceFiles.get(fileName) ||
                        save(ts.createSourceFile(fileName, sys.readFile(fileName), compilerOptions.target || defaultCompilerOptions(ts).target, false)));
                }, useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames }),
            updateFile: sourceFile => {
                const alreadyExists = sourceFiles.has(sourceFile.fileName);
                sys.writeFile(sourceFile.fileName, sourceFile.text);
                sourceFiles.set(sourceFile.fileName, sourceFile);
                return alreadyExists;
            },
        };
        return vHost;
    }
    exports.createVirtualCompilerHost = createVirtualCompilerHost;
    /**
     * Creates an object which can host a language service against the virtual file-system
     */
    function createVirtualLanguageServiceHost(sys, rootFiles, compilerOptions, ts) {
        const fileNames = [...rootFiles];
        const { compilerHost, updateFile } = createVirtualCompilerHost(sys, compilerOptions, ts);
        const fileVersions = new Map();
        let projectVersion = 0;
        const languageServiceHost = Object.assign(Object.assign({}, compilerHost), { getProjectVersion: () => projectVersion.toString(), getCompilationSettings: () => compilerOptions, getScriptFileNames: () => fileNames, getScriptSnapshot: fileName => {
                const contents = sys.readFile(fileName);
                if (contents) {
                    return ts.ScriptSnapshot.fromString(contents);
                }
                return;
            }, getScriptVersion: fileName => {
                return fileVersions.get(fileName) || "0";
            }, writeFile: sys.writeFile });
        const lsHost = {
            languageServiceHost,
            updateFile: sourceFile => {
                projectVersion++;
                fileVersions.set(sourceFile.fileName, projectVersion.toString());
                if (!fileNames.includes(sourceFile.fileName)) {
                    fileNames.push(sourceFile.fileName);
                }
                updateFile(sourceFile);
            },
        };
        return lsHost;
    }
    exports.createVirtualLanguageServiceHost = createVirtualLanguageServiceHost;
});
// https://github.com/hipstersmoothie/typescript-incremental-node-compiler-example
// https://codepen.io/joshadamous/pen/wJKzv - vertical tabs
define("amdBundler", ["require", "exports", "vfs"], function (require, exports, vfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    vfs = __importStar(vfs);
    let bootstrapPromise;
    const jsxFactoryElements = {
        createElement: 'createElement',
        createJSXElement: 'createJSXElement'
    };
    let compilerOptions = {
        target: 99,
        module: 2,
        allowJs: true,
        declaration: true,
        outFile: './dist/bundle.js',
        esModuleInterop: true,
        inlineSourceMap: true,
        inlineSources: true,
        skipLibCheck: true,
        jsx: 2,
        jsxFactory: 'createElement',
        importsNotUsedAsValues: 1
    };
    let env;
    function getUnifiedFileName(fileName) {
        if (fileName.startsWith('/'))
            return fileName;
        if (fileName.startsWith('./'))
            return fileName.replace('./', '/');
        return '/' + fileName;
    }
    function createVirtualLanguageServiceHost(sys, rootFiles, ts) {
        const fileNames = [...rootFiles];
        const { compilerHost, updateFile } = vfs.createVirtualCompilerHost(sys, compilerOptions, ts);
        const fileVersions = new Map();
        let projectVersion = 0;
        const languageServiceHost = Object.assign(Object.assign({}, compilerHost), { getProjectVersion() {
                return projectVersion.toString();
            },
            getCompilationSettings() {
                return compilerOptions;
            }, fileExists: sys.fileExists, getScriptFileNames() {
                return fileNames;
            },
            getScriptSnapshot(fileName) {
                const contents = sys.readFile(fileName);
                if (contents)
                    return ts.ScriptSnapshot.fromString(contents);
                return;
            },
            getScriptVersion(fileName) {
                return fileVersions.get(fileName) || "0";
            }, writeFile: sys.writeFile });
        const lsHost = {
            languageServiceHost: languageServiceHost,
            updateFile(sourceFile) {
                projectVersion++;
                fileVersions.set(sourceFile.fileName, projectVersion.toString());
                if (!fileNames.includes(sourceFile.fileName)) {
                    fileNames.push(sourceFile.fileName);
                }
                updateFile(sourceFile);
            },
            updateCompilerSettings() {
                projectVersion++;
            },
            deleteFile(fileName) {
                let index = fileNames.findIndex(item => item === fileName);
                ;
                if (index != -1)
                    fileNames.splice(index, 1);
                projectVersion++;
            }
        };
        return lsHost;
    }
    exports.createVirtualLanguageServiceHost = createVirtualLanguageServiceHost;
    function createVirtualTypeScriptEnvironment(sys, rootFiles, ts, compilerOptions = {}) {
        const defaultOptions = ts.getDefaultCompilerOptions();
        const mergedCompilerOpts = Object.assign(Object.assign({}, defaultOptions), compilerOptions);
        Object.assign(compilerOptions, mergedCompilerOpts);
        const { languageServiceHost, updateFile, deleteFile, updateCompilerSettings } = createVirtualLanguageServiceHost(sys, rootFiles, ts);
        const languageService = ts.createLanguageService(languageServiceHost);
        const diagnostics = languageService.getCompilerOptionsDiagnostics();
        if (diagnostics.length) {
            const compilerHost = vfs.createVirtualCompilerHost(sys, compilerOptions, ts);
            throw new Error(ts.formatDiagnostics(diagnostics, compilerHost.compilerHost));
        }
        const context = {
            sys,
            languageService,
            getSourceFile(fileName) {
                var _a;
                return (_a = languageService.getProgram()) === null || _a === void 0 ? void 0 : _a.getSourceFile(fileName);
            },
            createFile(fileName, content) {
                updateFile(ts.createSourceFile(fileName, content, mergedCompilerOpts.target, false));
            },
            updateFile(fileName, content, optPrevTextSpan) {
                let prevSourceFile = languageService.getProgram().getSourceFile(fileName);
                // if(!prevSourceFile)// TODO: why this check?
                // 	return context.createFile(fileName, content);
                const prevFullContents = prevSourceFile.text;
                // TODO: Validate if the default text span has a fencepost error?
                const prevTextSpan = optPrevTextSpan !== null && optPrevTextSpan !== void 0 ? optPrevTextSpan : ts.createTextSpan(0, prevFullContents.length);
                const newText = prevFullContents.slice(0, prevTextSpan.start) +
                    content +
                    prevFullContents.slice(prevTextSpan.start + prevTextSpan.length);
                const newSourceFile = ts.updateSourceFile(prevSourceFile, newText, {
                    span: prevTextSpan,
                    newLength: content.length,
                });
                updateFile(newSourceFile);
            },
            deleteFile,
            updateCompilerSettings
        };
        return context;
    }
    const amdBundler = {
        start(fsMap) {
            return __awaiter(this, void 0, void 0, function* () {
                const newMap = new Map();
                fsMap.forEach((value, key) => {
                    const newFileName = getUnifiedFileName(key);
                    newMap.set(newFileName, value);
                });
                if (bootstrapPromise)
                    return bootstrapPromise;
                bootstrapPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    const cdnFSMap = yield vfs.createDefaultMapFromCDN({}, ts.version, true, ts, undefined);
                    let fsMapWithLibs = new Map([...cdnFSMap, ...newMap]);
                    const fs = vfs.createSystem(fsMapWithLibs);
                    fs.deleteFile = fs.deleteFile || ((path) => {
                        if (fsMapWithLibs.has(path))
                            fsMapWithLibs.delete(path);
                    });
                    env = createVirtualTypeScriptEnvironment(fs, [...fsMapWithLibs.keys()], ts, compilerOptions);
                    resolve();
                }));
                return bootstrapPromise;
            });
        },
        createFile(fileName, content) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!env)
                    return Promise.reject();
                fileName = getUnifiedFileName(fileName);
                return Promise.resolve(env.createFile(fileName, content));
            });
        },
        updateFile(fileName, content, replaceTextSpan) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!env)
                    return Promise.reject();
                fileName = getUnifiedFileName(fileName);
                if (env.sys.fileExists(fileName)) {
                    if (content.length === 0)
                        content = `// This is just a placeholder for - ${fileName}`;
                    if (env.sys.readFile(fileName) === content)
                        return Promise.resolve();
                }
                else {
                    return amdBundler.createFile(fileName, content);
                }
                return Promise.resolve(env.updateFile(fileName, content, replaceTextSpan));
            });
        },
        delteFile(fileName) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!env)
                    return Promise.reject();
                fileName = getUnifiedFileName(fileName);
                if (!env.sys.fileExists(fileName))
                    return Promise.resolve();
                env.deleteFile(fileName);
                return Promise.resolve(env.sys.deleteFile(fileName));
            });
        },
        getBundle() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!env)
                    return Promise.reject();
                const result = env.languageService.getEmitOutput('/boot.ts');
                if (result.emitSkipped) {
                    return Promise.reject();
                }
                return Promise.resolve(result);
            });
        },
        setCompilerOptions(options) {
            Object.assign(compilerOptions, options);
            if (env)
                env.updateCompilerSettings();
        },
        getCompilerOptions() {
            return Object.assign({}, compilerOptions);
        },
        getEnvironMent() {
            return env;
        }
    };
    exports.default = amdBundler;
});
function setupMainThread() {
    /**
     * @type {MonacoPaths}
     */
    const paths = window.recordConfig ? window.recordConfig.paths : window.snMonacoConfig.paths;
    if (window.recordConfig) {
        const ylnSource = 'http://yln:9090';
        window.recordConfig.isYLNSource = paths.app.startsWith(ylnSource);
    }
    require.config({
        urlArgs: "sysparm_substitute=false",
        paths: {
            vs: paths.vsSource
        }
    });
    if (typeof Array.prototype['include'] == 'function')
        Array.prototype['include'] = undefined;
    window.MonacoEnvironment = {
        getWorkerUrl: function (workerId, label) {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
			self.MonacoEnvironment = {
			baseUrl: '${paths.monacoBase}'
			};
			importScripts('${paths.monacoWorker}');`)}`;
        }
    };
    requestAnimationFrame(() => {
        require(["./main"], ({ Main }) => {
            Main.init();
        });
    });
}
(function () {
    if (typeof window === 'undefined')
        return;
    document.addEventListener('DOMContentLoaded', () => {
        //TODO: why this is calling twice
        if (window.codenowInitialized)
            return;
        window.codenowInitialized = true;
        setupMainThread();
    });
})();
define("codenowStyle", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = `div.lines-content.monaco-editor-background > div.view-lines > div.view-line span > span:last-child.vs-whitespace {
  background-color: rgba(255, 0, 0, 0.4) !important; }

#ts_editor div.overflow-guard div.margin-view-overlays div.line-numbers {
  user-select: none; }

.header-flex-container {
  display: flex;
  flex-wrap: nowrap; }

.header-flex-container .header-flex-item {
  margin: 8px 0px; }

.header-flex-container .header-flex-item-now {
  transform: translate(2px, 10px); }

.header-flex-container .header-flex-item-middle {
  margin-left: 30px; }

.header-flex-container .header-flex-item-middle select {
  max-width: 100px !important; }

.header-flex-container .header-flex-last-item {
  margin-left: auto;
  margin-top: 15px; }

#maincontainer #themeselect {
  margin: 15px; }

#maincontainer .flex-container {
  padding: 0px 15px;
  margin: 0px;
  list-style: none;
  display: flex;
  flex-flow: row wrap; }

#maincontainer .flex-container .flex-item {
  width: 50%;
  margin: 15px 0px; }

#maincontainer .flex-container .flex-item:first-child {
  padding-right: 15px; }

#maincontainer .flex-container .flex-item div.ts_editor {
  height: 600px;
  border: 1px solid grey; }

#maincontainer .flex-container .flex-item #ts_sourcemap {
  overflow: scroll; }

.script-running {
  color: rgba(0, 0, 0, 0.7);
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  text-align: center;
  top: 45%;
  font-size: 5rem; }

.spin {
  animation: spin 900ms infinite linear; }

@keyframes spin {
  100% {
    transform: rotate(360deg); } }

.dbg-breakpoint {
  background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cdefs%3E%3Cstyle%3E.icon-canvas-transparent,.icon-vs-out{fill:%23f6f6f6}.icon-canvas-transparent{opacity:0}.icon-vs-red{fill:%23e51400}%3C/style%3E%3C/defs%3E%3Ctitle%3Ebreakpoint%3C/title%3E%3Cpath class='icon-canvas-transparent' d='M16 0v16H0V0z' id='canvas'/%3E%3Cpath class='icon-vs-red' d='M11.789 8A3.789 3.789 0 1 1 8 4.211 3.788 3.788 0 0 1 11.789 8z' id='iconBg'/%3E%3C/svg%3E") 50% no-repeat; }

@keyframes gotoLine {
  0% {
    transform: scale(1.3); }
  100% {
    transform: scale(1); } }

.gotoLine {
  animation: gotoLine .3s infinite alternate;
  background: linear-gradient(to right, #FFEB3B, #FFEB3B); }

.dbg-breakpoint1 {
  background: radial-gradient(circle at 50% 120%, #ea0e0e, #ef0c0c 80%, #b33636 100%);
  border-radius: 50%; }

.dbg-breakpoint1::before {
  content: "";
  position: absolute;
  background: radial-gradient(circle at 50% 120%, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  bottom: 2.5%;
  left: 5%;
  opacity: 0.6;
  height: 100%;
  width: 90%;
  filter: blur(5px);
  z-index: 2; }

#devinfo #js_editor {
  width: 100%;
  min-height: 600px; }

.ts_editor_container {
  min-height: 800px;
  font-family: monaco, menlo; }

.ts_editor_container textarea {
  position: absolute; }

.ts_editor_container .editor_wrapper {
  position: relative;
  width: 99.99%;
  min-height: 600px; }

.ts_editor_container .editor_wrapper #new-breakpoint-menu,
.ts_editor_container .editor_wrapper #edit-breakpoint-menu {
  font-family: monaco, menlo;
  font-size: 13px;
  width: 90%;
  position: absolute;
  top: 0px;
  left: 0px;
  transition: .5s ease-in-out; }

.ts_editor_container .editor_wrapper #new-breakpoint-menu a,
.ts_editor_container .editor_wrapper #edit-breakpoint-menu a {
  padding: 8px 20px; }

.ts_editor_container .editor_wrapper #new-breakpoint-menu input,
.ts_editor_container .editor_wrapper #edit-breakpoint-menu input {
  width: 100%;
  padding: 8px;
  color: blueviolet; }

.ts_editor_container .editor_wrapper #themeselect {
  height: 24px;
  margin: 0px 10px; }

.ts_editor_container .editor_wrapper #ts_editor,
.ts_editor_container .editor_wrapper #js_editor {
  position: relative;
  width: 95%;
  min-height: 600px;
  border: 1px solid grey; }

.ts_editor_container .editor_wrapper #js_editor {
  top: 20px; }

.ts_editor_container .monaco-action-bar.vertical .action-label.separator {
  margin-top: 0px;
  margin-bottom: 6px; }

.ts_editor_container .monaco-action-bar.vertical .action-label.disabled {
  height: 0px;
  border-left-width: 0px;
  border-right-width: 0px; }

.vs .FileSearch {
  background: #ffffff;
  -webkit-box-shadow: 0 5px 8px #a59a9a;
  box-shadow: 0 5px 8px #a59a9a; }

.vs .FileSearch .FileSearch-searchInput {
  background-color: white;
  border: 1px solid #9C27B0;
  color: black; }

.vs .FileSearch .FileSearch-filesWrapper {
  color: #9C27B0; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file.selected {
  background: #cacae4 !important; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file:hover {
  background: #f2f2f7; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file .normName {
  white-space: nowrap; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file .normName .highlight {
  color: #2196F3; }

.hc-black .FileSearch,
.vs-dark .FileSearch {
  background: #252526;
  -webkit-box-shadow: 0 5px 8px #000;
  box-shadow: 0 5px 8px #000; }

.hc-black .FileSearch .FileSearch-searchInput,
.vs-dark .FileSearch .FileSearch-searchInput {
  background: #3c3c3c;
  border: 1px solid #164165;
  color: #2196F3; }

.hc-black .FileSearch .FileSearch-filesWrapper,
.vs-dark .FileSearch .FileSearch-filesWrapper {
  color: #2196F3; }

.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file.selected,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file.selected {
  background: #073655 !important; }

.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file:hover, .hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file.selected,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file:hover,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file.selected {
  background: #4a4d4e; }

.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file .normName,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file .normName {
  white-space: nowrap; }

.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file .normName .highlight,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file .normName .highlight {
  color: #9C27B0; }

.vs #file-menu-container > li.clickable:not(.active),
.vs-dark #file-menu-container > li.clickable:not(.active),
.hc-black #file-menu-container > li.clickable:not(.active) {
  border-right: 1px solid #e2dbdb; }

.vs .FileSearch,
.vs-dark .FileSearch,
.hc-black .FileSearch {
  top: 0;
  position: absolute;
  z-index: 999;
  width: 60%;
  margin: 0 20%;
  font-size: 13px;
  z-index: 100;
  font-family: monaco, menlo; }

.vs .FileSearch .FileSearch-searchWrapper,
.vs-dark .FileSearch .FileSearch-searchWrapper,
.hc-black .FileSearch .FileSearch-searchWrapper {
  padding: 8px; }

.vs .FileSearch.hidden,
.vs-dark .FileSearch.hidden,
.hc-black .FileSearch.hidden {
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute; }

.vs .FileSearch .FileSearch-searchInput,
.vs-dark .FileSearch .FileSearch-searchInput,
.hc-black .FileSearch .FileSearch-searchInput {
  width: 100%;
  padding: 2px 4px;
  margin-bottom: 0;
  font-size: 13px;
  font-weight: bold; }

.vs .FileSearch .FileSearch-filesWrapper,
.vs-dark .FileSearch .FileSearch-filesWrapper,
.hc-black .FileSearch .FileSearch-filesWrapper {
  width: 100%;
  max-height: 40vh;
  overflow-y: auto;
  overflow-x: hidden; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file,
.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file {
  padding: 2px 8px 2px 8px;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  position: relative; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file img,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file img,
.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file img {
  width: 15px;
  margin-right: 8px; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file .fullName,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file .fullName,
.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file .fullName {
  font-size: 11px;
  margin-left: 5px;
  color: #8b8b8c;
  white-space: nowrap; }

.vs .FileSearch .FileSearch-filesWrapper .FileSearch-file .file-icon,
.vs-dark .FileSearch .FileSearch-filesWrapper .FileSearch-file .file-icon,
.hc-black .FileSearch .FileSearch-filesWrapper .FileSearch-file .file-icon {
  left: 5px;
  top: 3px;
  height: 16px;
  width: 16px;
  margin-right: 5px;
  position: absolute; }

#yln-standalone-editor #workarea-toggler {
  margin-left: 8px; }

#yln-standalone-editor .workarea-toggler {
  user-select: none; }

#yln-standalone-editor .workarea-toggler.workarea-resize-mode .resize-screen {
  display: none; }

#yln-standalone-editor .workarea-toggler.workarea-full-screen-mode .full-screen {
  display: none; }

#yln-standalone-editor #compiler-settings-container .popover-content {
  padding: 0px 0px !important; }

#yln-standalone-editor #compiler-settings-container .checked-list-box {
  user-select: none; }

#yln-standalone-editor #compiler-settings-container .checked-list-box li {
  cursor: pointer;
  text-align: left; }

#yln-standalone-editor .navbar-control {
  margin: 8px; }

#yln-standalone-editor .workspace-area {
  position: absolute;
  top: 50px;
  bottom: 0px;
  left: 0px;
  right: 0px;
  overflow: hidden; }

#yln-standalone-editor .workspace-area .resize-width {
  width: 100%; }

#yln-standalone-editor .workspace-area .resize-width .output-area {
  width: 40%; }

#yln-standalone-editor .workspace-area .resize-width .output-area .tab-content {
  position: absolute;
  top: 51px;
  bottom: 0px;
  overflow: auto;
  width: 40%; }

#yln-standalone-editor .workspace-area .resize-width .output-area .tab-content > div {
  padding: 10px;
  width: 100%;
  height: calc(100% - 20px); }

#yln-standalone-editor .workspace-area .resize-width #seismic_host {
  width: 1024px;
  height: 768px; }

#yln-standalone-editor .workspace-area .fullscreen-width {
  width: 200%; }

#yln-standalone-editor .workspace-area .fullscreen-width .output-area {
  width: 40%; }

#yln-standalone-editor .workspace-area .fullscreen-width .output-area .tab-content {
  position: absolute;
  top: 51px;
  bottom: 0px;
  overflow: auto;
  width: 40%;
  min-width: 1050px; }

#yln-standalone-editor .workspace-area .fullscreen-width .output-area .tab-content > div {
  padding: 10px;
  width: 100%;
  height: calc(100% - 20px); }

#yln-standalone-editor .workspace-area .fullscreen-width #seismic_host {
  width: 100%;
  height: 100%; }

#yln-standalone-editor .workspace-area #file-menu-container-div {
  position: relative;
  left: 49px;
  width: calc(100% - 50px); }

#yln-standalone-editor .workspace-area #file-menu-container-div li.clickable .tab-no-close, #yln-standalone-editor .workspace-area #file-menu-container-div ul.add-file-type .tab-no-close {
  padding: 5px 15px !important; }

#yln-standalone-editor .workspace-area #file-menu-container-div li.clickable a, #yln-standalone-editor .workspace-area #file-menu-container-div ul.add-file-type a {
  margin-right: -1px !important;
  user-select: none;
  padding: 5px 5px; }

#yln-standalone-editor .workspace-area #file-menu-container-div li.clickable span, #yln-standalone-editor .workspace-area #file-menu-container-div ul.add-file-type span {
  color: gray; }

#yln-standalone-editor .workspace-area #file-menu-container-div li.clickable i, #yln-standalone-editor .workspace-area #file-menu-container-div ul.add-file-type i {
  border-radius: 50%;
  color: gray;
  transform: rotate(0deg);
  transition: transform .25s ease; }

#yln-standalone-editor .workspace-area #file-menu-container-div li.clickable i:hover, #yln-standalone-editor .workspace-area #file-menu-container-div ul.add-file-type i:hover {
  color: red;
  transform: rotate(180deg);
  transition: transform .25s ease; }

#yln-standalone-editor .workspace-area #file-menu-container-div li.clickable svg, #yln-standalone-editor .workspace-area #file-menu-container-div ul.add-file-type svg {
  width: 22px;
  height: 16px;
  position: relative;
  top: 5px; }

#yln-standalone-editor .workspace-area #file-menu-container-div .dropdown:hover .dropdown-menu {
  display: block; }

#yln-standalone-editor .workspace-area #file-menu-container-div .add-file {
  padding: 5px 0px 0px 10px;
  width: 50px; }

#yln-standalone-editor .workspace-area #file-menu-container-div .add-file #add-file-button {
  transform: rotate(0deg);
  transition: transform .25s ease; }

#yln-standalone-editor .workspace-area #file-menu-container-div .add-file #add-file-button:hover {
  border-radius: 50%;
  background-color: rgba(60, 64, 67, 0.078);
  transform: rotate(90deg);
  transition: transform .25s ease; }

#yln-standalone-editor .workspace-area #file-menu-container-div .close-icon {
  margin-left: 5px;
  position: relative;
  top: 3px; }

#yln-standalone-editor .workspace-area .right-side-wrapper {
  position: absolute;
  left: 50px;
  right: 0px;
  top: 45px;
  bottom: 0px;
  max-width: 100%; }

#yln-standalone-editor .workspace-area .right-side-wrapper .right-side-area {
  left: 0px;
  top: 0px;
  position: absolute;
  padding: 10px;
  right: 0px;
  bottom: 0px;
  display: flex;
  flex-flow: row wrap; }

#yln-standalone-editor .workspace-area .right-side-wrapper .right-side-area .input-area {
  display: flex;
  width: 60%; }

#yln-standalone-editor .workspace-area .right-side-wrapper .right-side-area .input-area #ts_editor {
  width: 100%;
  height: 100%; }

#yln-standalone-editor .workspace-area .sidebar-left {
  width: 50px;
  position: absolute;
  top: 0px;
  bottom: 0px;
  border-right: 1px solid #e6e6e6;
  border-top: 1px solid #e6e6e6;
  background: whitesmoke; }

#yln-standalone-editor .workspace-area .sidebar-left .top ul,
#yln-standalone-editor .workspace-area .sidebar-left .bottom ul {
  width: 100%;
  list-style: none;
  margin: 0px;
  padding: 0px; }

#yln-standalone-editor .workspace-area .sidebar-left .top ul li,
#yln-standalone-editor .workspace-area .sidebar-left .bottom ul li {
  text-align: center; }

#yln-standalone-editor .workspace-area .sidebar-left .top ul li i,
#yln-standalone-editor .workspace-area .sidebar-left .bottom ul li i {
  padding: 8px 0px; }

#yln-standalone-editor .workspace-area .sidebar-left .top ul li::hover,
#yln-standalone-editor .workspace-area .sidebar-left .bottom ul li::hover {
  color: darkgray; }

#yln-standalone-editor .workspace-area .sidebar-left .bottom {
  bottom: 0px;
  position: absolute;
  width: 50px; }

#yln-standalone-editor .workspace-area .sidebar-left .bottom li i.debug {
  padding: 16px 0px;
  width: 14px;
  background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDUxMi4wMDEgNTEyLjAwMSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyLjAwMSA1MTIuMDAxOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTI2OS40MDIsMjAxLjI1OGMtMzYuMzQxLDAtNjUuOTA4LDI5LjU2Ny02NS45MDgsNjUuOTA4YzAsMzYuMzQzLDI5LjU2Nyw2NS45MDksNjUuOTA4LDY1LjkwOQ0KCQkJYzM2LjM0NCwwLDY1LjkxMS0yOS41NjcsNjUuOTExLTY1LjkwOUMzMzUuMzEyLDIzMC44MjUsMzA1Ljc0NiwyMDEuMjU4LDI2OS40MDIsMjAxLjI1OHogTTI2OS40MDIsMzA4LjEzNg0KCQkJYy0yMi41OTEsMC00MC45NjktMTguMzc5LTQwLjk2OS00MC45N3MxOC4zNzktNDAuOTY5LDQwLjk2OS00MC45NjljMjIuNTkxLDAsNDAuOTcxLDE4LjM3OSw0MC45NzEsNDAuOTY5DQoJCQlTMjkxLjk5NCwzMDguMTM2LDI2OS40MDIsMzA4LjEzNnoiLz4NCgk8L2c+DQo8L2c+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTUxMC4yOTgsMTUzLjIxMmM0Ljg1NC0zNS42Ny0wLjcxOC02Ni4wMS0xNi4xMTYtODguNDIxYzIuNTItNS41NjMsMy45MzUtMTEuNzI5LDMuOTM1LTE4LjIyMw0KCQkJYzAtMjQuNDQzLTE5Ljg4NS00NC4zMjktNDQuMzI5LTQ0LjMyOWMtMTYuNTE4LDAtMzAuOTQ2LDkuMDg5LTM4LjU3MSwyMi41MjFjLTQxLjc2MS0yLjA4Ny05Mi44OTIsMTMuMjU4LTE0NS44MTcsNDMuODMzDQoJCQlDMTc5LjAzOCwxNi4zNyw5Ny4yMjUsMTAuMDk3LDU0Ljc4NSw1Mi41NTJDMzYuMzQsNzAuOTk3LDI2Ljc4Nyw5Ny4zODksMjYuODMxLDEyOS4yNzRDMTEuMDY1LDEzNi4wNzUsMCwxNTEuNzY1LDAsMTY5Ljk5Ng0KCQkJYzAsMjQuNDQzLDE5Ljg4Niw0NC4zMjksNDQuMzI5LDQ0LjMyOWMwLjI1NywwLDAuNTEtMC4wMTUsMC43NjYtMC4wMmM2LjgxOCwxNy4zNCwxNS40NDIsMzUuMDU3LDI1LjczLDUyLjg2Mg0KCQkJQzE4LjYwMiwzNTcuNTI4LDEyLjMzLDQzOS4zNDEsNTQuNzgzLDQ4MS43ODFjMTguNzI5LDE4LjczNCw0NS4xMTYsMjcuOTgyLDc2LjUyNywyNy45ODENCgkJCWMzOS43NzQtMC4wMDEsODcuNjAxLTE0Ljg0MywxMzguMDg5LTQ0LjAyYzUwLjQ5MiwyOS4xOCw5OC4zMTQsNDQuMDIsMTM4LjA5Miw0NC4wMmMzMS40MSwwLDU3LjgwNS05LjI0Nyw3Ni41MzYtMjcuOTc4DQoJCQljNDIuNDUtNDIuNDUxLDM2LjE2Ny0xMjQuMjY4LTE2LjA3LTIxNC42MjRDNDkwLjkzMywyMjcuMzg2LDUwNS41NDgsMTg4LjEyLDUxMC4yOTgsMTUzLjIxMnogTTQ1My43ODgsMjcuMTc4DQoJCQljMTAuNjkxLDAsMTkuMzksOC42OTksMTkuMzksMTkuMzljMCwxMC42OTEtOC42OTksMTkuMzktMTkuMzksMTkuMzlzLTE5LjM5LTguNjk5LTE5LjM5LTE5LjM5UzQ0My4wOTYsMjcuMTc4LDQ1My43ODgsMjcuMTc4eg0KCQkJIE00MDkuNTY3LDQ5LjUxMWMxLjUyMSwyMy4wNzUsMjAuNzY3LDQxLjM4Nyw0NC4yMjEsNDEuMzg3YzguNDkxLDAsMTYuNDI5LTIuNDA0LDIzLjE3Ny02LjU2DQoJCQljOS4yMzEsMTYuNzYsMTIuMjE1LDM5LjEwOCw4LjYyMiw2NS41MTNjLTMuODU2LDI4LjM0My0xNS4wODMsNjAuMTkzLTMyLjY1OCw5My4wMjRjLTIwLjAzNi0zMC4zODgtNDQuMTE1LTU5LjcyNC03MS44MTItODcuNDIzDQoJCQljLTI3LjY5Ni0yNy42OTYtNTcuMDQxLTUxLjc4MS04Ny40NDUtNzEuODM0QzMzNi4yNDQsNjAuNzksMzc2LjQ0OCw0OC45NSw0MDkuNTY3LDQ5LjUxMXogTTQ0LjMyOSwxODkuMzg2DQoJCQljLTEwLjY5MSwwLTE5LjM5LTguNjk4LTE5LjM5LTE5LjM5YzAtMTAuNjkxLDguNjk5LTE5LjM5LDE5LjM5LTE5LjM5YzEwLjY5MSwwLDE5LjM5LDguNjk5LDE5LjM5LDE5LjM5DQoJCQlDNjMuNzIsMTgwLjY4Nyw1NS4wMjEsMTg5LjM4Niw0NC4zMjksMTg5LjM4NnogTTY4Ljk3NiwyMDYuODIyYzExLjg2MS03Ljk2NCwxOS42ODMtMjEuNDk4LDE5LjY4My0zNi44MjYNCgkJCWMwLTIxLjkwMy0xNS45NzQtNDAuMTM3LTM2Ljg4MS00My42OTFjMC41MDUtMjMuNzYxLDcuNTQyLTQzLjAxOCwyMC42NDItNTYuMTE5YzMxLjg4Ni0zMS44OTUsOTguNDE0LTI2LjI4NywxNzIuNjg4LDEzLjQ0NQ0KCQkJYy0zMC4zOTgsMjAuMDUtNTkuNzM0LDQ0LjEzMS04Ny40MjQsNzEuODIxYy0yNy42OTQsMjcuNjk0LTUxLjc3Niw1Ny4wMzMtNzEuODI2LDg3LjQzMg0KCQkJQzc5LjM0NSwyMzAuNzE4LDczLjcwOCwyMTguNjY0LDY4Ljk3NiwyMDYuODIyeiBNNzIuNDE3LDQ2NC4xNDdjLTMxLjg5NS0zMS44ODUtMjYuMjg3LTk4LjQxNCwxMy40NDUtMTcyLjY4Ng0KCQkJYzIwLjA0OSwzMC4zOTcsNDQuMTMsNTkuNzMzLDcxLjgyMSw4Ny40MjRjMjcuNjkxLDI3LjY5LDU3LjAyNyw1MS43NzEsODcuNDI0LDcxLjgyMQ0KCQkJQzE3MC44MzMsNDkwLjQzNSwxMDQuMzA2LDQ5Ni4wNDMsNzIuNDE3LDQ2NC4xNDd6IE0xNzUuMzE5LDM2MS4yNDljLTI5LjcwOS0yOS43MDgtNTUuMDUyLTYxLjMyOC03NS40MjEtOTQuMDgyDQoJCQljMjAuMzY3LTMyLjc1Myw0NS43MTEtNjQuMzcyLDc1LjQyMS05NC4wODJjMjkuNzA5LTI5LjcwOSw2MS4zMjgtNTUuMDUzLDk0LjA4Mi03NS40MjENCgkJCWMzMi43NTMsMjAuMzY5LDY0LjM3Myw0NS43MTIsOTQuMDgyLDc1LjQyMWMyOS43MTgsMjkuNzE5LDU1LjA1OCw2MS4zMzcsNzUuNDA5LDk0LjA4MmMtMjAuMzUsMzIuNzQzLTQ1LjY5LDY0LjM2My03NS40MDksOTQuMDgyDQoJCQljLTI5LjcwOSwyOS43MDktNjEuMzI5LDU1LjA1My05NC4wODIsNzUuNDIxQzIzNi42NDgsNDE2LjMwMiwyMDUuMDI3LDM5MC45NTgsMTc1LjMxOSwzNjEuMjQ5eiBNNDY2LjM5Miw0NjQuMTQ4DQoJCQljLTMxLjg5NiwzMS44OTMtOTguNDI3LDI2LjI4Ny0xNzIuNy0xMy40NDNjMzAuMzk3LTIwLjA0OSw1OS43MzMtNDQuMTMsODcuNDI0LTcxLjgyMWMyNy42OTktMjcuNjk5LDUxLjc3Ni01Ny4wMzUsNzEuODExLTg3LjQyMQ0KCQkJQzQ5Mi42NjgsMzY1LjczMSw0OTguMjgzLDQzMi4yNTksNDY2LjM5Miw0NjQuMTQ4eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K") no-repeat 50% 50%; }

#yln-standalone-editor .nav-tabs > li {
  margin-bottom: -2px; }

#yln-standalone-editor.vs-dark .eslint, #yln-standalone-editor.hc-black .eslint {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .dropdown-menu, #yln-standalone-editor.vs-dark cmd_group, #yln-standalone-editor.hc-black .dropdown-menu, #yln-standalone-editor.hc-black cmd_group {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .dropdown-menu .divider, #yln-standalone-editor.vs-dark cmd_group .divider, #yln-standalone-editor.hc-black .dropdown-menu .divider, #yln-standalone-editor.hc-black cmd_group .divider {
  background-color: #4a4747; }

#yln-standalone-editor.vs-dark .dropdown-menu a, #yln-standalone-editor.vs-dark cmd_group a, #yln-standalone-editor.hc-black .dropdown-menu a, #yln-standalone-editor.hc-black cmd_group a {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .dropdown-menu a:hover, #yln-standalone-editor.vs-dark cmd_group a:hover, #yln-standalone-editor.hc-black .dropdown-menu a:hover, #yln-standalone-editor.hc-black cmd_group a:hover {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6);
  background-color: rgba(99, 91, 91, 0.75); }

#yln-standalone-editor.vs-dark #file-menu-container > li.clickable:not(.active), #yln-standalone-editor.hc-black #file-menu-container > li.clickable:not(.active) {
  border-right: none; }

#yln-standalone-editor.vs-dark .script-running, #yln-standalone-editor.hc-black .script-running {
  color: yellow; }

#yln-standalone-editor.vs-dark .workspace-area, #yln-standalone-editor.hc-black .workspace-area {
  overflow: hidden; }

#yln-standalone-editor.vs-dark .workspace-area .sidebar-left, #yln-standalone-editor.hc-black .workspace-area .sidebar-left {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.2); }

#yln-standalone-editor.vs-dark #Layer_1-2 > polygon.cls-1,
#yln-standalone-editor.vs-dark #Layer_1-2 > path.cls-1, #yln-standalone-editor.hc-black #Layer_1-2 > polygon.cls-1,
#yln-standalone-editor.hc-black #Layer_1-2 > path.cls-1 {
  fill: rgba(255, 255, 255, 0.9); }

#yln-standalone-editor.vs-dark .panel-default,
#yln-standalone-editor.vs-dark .alert-info, #yln-standalone-editor.hc-black .panel-default,
#yln-standalone-editor.hc-black .alert-info {
  border-color: rgba(221, 221, 221, 0.13); }

#yln-standalone-editor.vs-dark .nav-tabs > li.active > a,
#yln-standalone-editor.vs-dark .nav-tabs > li.active > a:focus,
#yln-standalone-editor.vs-dark .nav-tabs > li.active > a:hover, #yln-standalone-editor.hc-black .nav-tabs > li.active > a,
#yln-standalone-editor.hc-black .nav-tabs > li.active > a:focus,
#yln-standalone-editor.hc-black .nav-tabs > li.active > a:hover {
  border: 1px solid rgba(221, 221, 221, 0.4);
  border-bottom-color: transparent;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .nav-tabs, #yln-standalone-editor.hc-black .nav-tabs {
  border-bottom: 1px solid rgba(221, 221, 221, 0.4); }

#yln-standalone-editor.vs-dark .nav-tabs > li:not(.active) > a, #yln-standalone-editor.hc-black .nav-tabs > li:not(.active) > a {
  border-color: rgba(255, 255, 255, 0.2); }

#yln-standalone-editor.vs-dark #compiler-settings-container h3.popover-title {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark #compiler-settings-container .checked-list-box li,
#yln-standalone-editor.vs-dark #compiler-settings-container .checked-list-box select {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .panel {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark #UpdateSI,
#yln-standalone-editor.vs-dark #UpdateTableAPI {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .alert-info {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark #output-tabs > li > a,
#yln-standalone-editor.vs-dark #file-menu-container > li > a {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6);
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark #output-tabs > li > a:hover,
#yln-standalone-editor.vs-dark #file-menu-container > li > a:hover {
  background-color: rgba(99, 91, 91, 0.75); }

#yln-standalone-editor.vs-dark #script-output pre {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark > .workspace-area,
#yln-standalone-editor.vs-dark .container-fluid {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .header-flex-item-middle select {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .workspace-area {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .workspace-area .sidebar-left {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6);
  color: rgba(255, 255, 255, 0.5); }

#yln-standalone-editor.vs-dark .workspace-area .sidebar-left li:hover {
  color: white; }

#yln-standalone-editor.vs-dark .workspace-area .add-file-type {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6); }

#yln-standalone-editor.vs-dark .workspace-area .add-file-type a:hover {
  background-color: #1e1e1e;
  color: rgba(255, 255, 255, 0.6);
  background-color: rgba(99, 91, 91, 0.75); }

#yln-standalone-editor.vs-dark .workspace-area #file-menu-container #add-file-button,
#yln-standalone-editor.vs-dark .workspace-area #file-menu-container #add-file-button:hover {
  background-color: #8108f1;
  border-radius: 50%; }

#yln-standalone-editor.hc-black #compiler-settings-container h3.popover-title {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black #compiler-settings-container .checked-list-box li,
#yln-standalone-editor.hc-black #compiler-settings-container .checked-list-box select {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black .panel {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black .alert-info {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black #UpdateSI,
#yln-standalone-editor.hc-black #UpdateTableAPI {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black #output-tabs > li > a {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black #output-tabs > li > a:hover {
  background-color: rgba(99, 91, 91, 0.75); }

#yln-standalone-editor.hc-black #script-output pre {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black > .workspace-area,
#yln-standalone-editor.hc-black .container-fluid {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black .header-flex-item-middle select {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black .workspace-area {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black .workspace-area .sidebar-left {
  background-color: black;
  color: white; }

#yln-standalone-editor.hc-black .workspace-area > .right-side-area {
  border-top: 1px solid rgba(255, 255, 255, 0.2); }

#success_modal .modal-content > div,
#fail_modal .modal-content > div {
  padding: 8px !important; }
`;
});
define("codenowUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeNowActionTypes = {
        get_schema: 'get_schema',
        update_table_schema: 'update_table_schema',
        update_debugger_script: 'update_debugger_script',
        update_si: 'update_si',
        get_seismic_info: 'get_seismic_info'
    };
    class CodeNowUtils {
        static snFetch(input, init, isJSON = true) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!init)
                    init = {};
                const headers = init.headers || {
                    "Content-Type": 'application/json',
                    "accept": "application/json"
                };
                headers['X-UserToken'] = window.g_ck;
                init.headers = headers;
                if (!isJSON)
                    return yield fetch(input, init);
                return yield (yield fetch(input, init)).json();
            });
        }
        static doAction(payload, isJSON = true) {
            return __awaiter(this, void 0, void 0, function* () {
                return CodeNowUtils.snFetch(`/api/now/typescript_helpers/do_action/${payload.cmd}`, {
                    body: JSON.stringify(payload),
                    method: 'POST'
                }, isJSON);
            });
        }
        static isSuccessful(actionResult) {
            return actionResult.status === 'ok';
        }
    }
    exports.CodeNowUtils = CodeNowUtils;
    var FieldType;
    (function (FieldType) {
        FieldType["Collection"] = "collection";
        FieldType["Reference"] = "reference";
        FieldType["Choice"] = "choice";
        FieldType["string"] = "string";
        FieldType["type_boolean"] = "boolean";
        FieldType["DocumentID"] = "document_id";
        FieldType["SourceID"] = "source_id";
        FieldType["PhoneNumber"] = "phone_number_e164";
        FieldType["GlideVar"] = "glide_var";
    })(FieldType = exports.FieldType || (exports.FieldType = {}));
    function getFieldNameFromMonacoField(field) {
        if (field.host && field.host.hostType === FieldType.GlideVar)
            return field.host.name;
        return field.name;
    }
    exports.getFieldNameFromMonacoField = getFieldNameFromMonacoField;
});
define("constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LangType;
    (function (LangType) {
        LangType["javascript"] = "javascript";
        LangType["typescript"] = "typescript";
        LangType["css"] = "css";
        LangType["html"] = "html";
    })(LangType = exports.LangType || (exports.LangType = {}));
    exports.GLOBAL_SOCPE = "global";
    exports.JAVA_GLOBAL_API = "JavaGlobalAPI.d.ts";
    exports.JAVA_SCOPE_API = "JavaScopeAPI.d.ts";
    exports.TABLE_API = "TableAPI.d.ts";
    exports.JS_API = "JSAPI.d.ts";
    exports.TYPE_DEFS = "sn_typedef.d.ts";
    exports.CURRENT_API = "CurrentAPI.d.ts";
    exports.libES5Path = "vs/language/typescript/lib/lib-ts";
    exports.libES6Path = "vs/language/typescript/lib/lib-es6-ts";
    exports.TS_DECLARATION = "ts_definition";
    exports.DECLARATION_DATA_PATH = "../metadata/snapi.json";
    exports.DECLARATION_TABLE_PATH = "/api/now/table/ts_definition";
    exports.FIELD_DECLARATION = "typedeclaration";
    exports.FIELD_SOURCEMAP = "typesourcemap";
    exports.FIELD_TS_SCRIPT = "tsscript";
    exports.FIELD_SCRIPT = 'script';
    exports.EL_TS_EDITOR = 'ts_editor';
    exports.EL_JS_EDITOR = 'js_editor';
    exports.EL_TS_DECL = 'ts_decl';
    exports.EL_TS_SOURCEMAP = 'ts_sourcemap';
    exports.EL_THEME_SELECT = 'themeselect';
    exports.EL_SCOPE_SELECT = 'scope-select';
    exports.EL_SCRIPT_RUNNER = 'script-runner';
    exports.EL_SCRIPT_OUTPUT = 'script-output';
    exports.READONLY_OUTPUT_FILE_NAME = 'es5Module.js';
    exports.DEBUG_POINTS_MODIFIED_EVENT = 'DebugPointsUpdated';
    exports.REMOVE_DEBUG_POINT_EVALUATION_STRING = 'none';
    var TableNames;
    (function (TableNames) {
        TableNames["sys_script_include"] = "sys_script_include";
        TableNames["ts_definition"] = "ts_definitions";
    })(TableNames = exports.TableNames || (exports.TableNames = {}));
    exports.jsxFactoryTypes = ['createElement', 'snc.createJSXElement'];
    exports.CODENOW_SEISMIC_FS_KEY = 'CODENOW_SEISMIC_LOCAL_STOREAGE_KEY';
    exports.CODENOW_SCRIPT_RUNNER_FS_KEY = 'CODENOW_SCRIPT_RUNNER_LOCAL_STORAGE_KEY';
    exports.CSS_FILE_NAME = 'styles.css';
    exports.HTML_FILE_NAME = 'boot.html';
    exports.BOOT_FILE_NAME = 'boot.ts';
    exports.FIDDLE_TABLE_URL = 'api/now/table/ux_fiddle_play';
    exports.FIDDLE_TABLE_NAME = 'fx_fiddle_play';
    exports.emojis = ["😀", "😁", "😂", "😃", "😄", "😅", "😆", "😇", "😈", "😉", "😊", "😋", "😌", "😍", "😎", "😏", "😐", "😑", "😒", "😓", "😔", "😕", "😖", "😗", "😘", "😙", "😚", "😛", "😜", "😝", "😞", "😟", "😠", "😡", "😢", "😣", "😤", "😥", "😦", "😧", "😨", "😩", "😪", "😫", "😬", "😭", "😮", "😯", "😰", "😱", "😲", "😳", "😴", "😵", "😶", "😷", "🙁", "🙂", "🙃", "🙄", "🤐", "🤑", "🤒", "🤓", "🤔", "🤕", "🤠", "🤡", "🤢", "🤣", "🤤", "🤥", "🤧", "🤨", "🤩", "🤪", "🤫", "🤬", "🤭", "🤮", "🤯", "🧐"];
    exports.SAMPLE_TS_CONTENT = `// This is a sample typescript SI
  class Point {
	  constructor(public x = 0, public y = 0) {
		  this.initialize(x, y);
	  }
	  initialize(x = 0, y = 0) {
		  this.x = x;
		  this.y = y;
	  }
  }`;
    exports.SAMPLE_JS_CONTENT = `// This is a sample ES6 class style SI
  class Point {
	  constructor(x = 0, y = 0) {
		  this.x = x;
		  this.y = y;
	  }
	  initialize(x = 0, y = 0) {
		  this.x = x;
		  this.y = y;
	  }
  }`;
    exports.SAMPLE_STANDARD_SI_CONTENT = `// This is standard SI
  var Point = Class.create();
  Point.prototype = {
	  /**
	   * @type {number}
	   */
	  x: null,
	  /**
	   * @type {number}
	   */
	  y: null,
	  /**
	   * @param {number=} x
	   * @param {number=} y
	   */
	  initialize: function (x, y) {
		  if (void 0 === x)
			  x = 0;
		  if (void 0 === y)
			  y = 0;
		  this.x = x;
		  this.y = y;
	  },
	  type: 'Point'
  };`;
    //export const SAMPLE_SEISMIC_CONTENT = "";
    exports.snippets = [{ "label": "doc", "doc": "Documentation Header ", "text": "/**\r \n* Description: $0\r \n* Parameters: \r \n* Returns:\r\n*/\r " }, { "label": "for", "doc": "Standard loop for arrays", "text": "for (var i=0; i< myArray.length; i++) {\r\n //myArray[i];\r \n}\r\n\r " }, { "label": "vargror", "doc": "Example GlideRecord Or Query", "text": "var gr = new GlideRecord('${1:tableName}');\r \nvar qc = gr.addQuery('${2:columnName}', 'value1');\r \nqc.addOrCondition('${0:columnName}', 'value2');\r\ngr.query();\r \nwhile (gr.next()) {\r\n\r \n}\r\n\r " }, { "label": "info", "doc": "", "text": "gs.addInfoMessage(gs.getMessage(\"$0\"));" }, { "label": "method", "doc": "Standard JavaScript Class Method", "text": "/*_________________________________________________________________\r\n   * Description:\r\n   * Parameters:\r\n   * Returns:\r\n   ________________________________________________________________*/\r\n   $0: function() {\r\n   \r\n   },\r\n" }, { "label": "vargr", "doc": "A common pattern of creating and querying a GlideRecord", "text": "var gr = new GlideRecord(\"$0\");\r\ngr.addQuery(\"name\", \"value\");\r\ngr.query();\r\nif (gr.next()) {\r\n   \r\n}\r\n" }];
    exports.scopes = { "3ad18693db92220004997878f0b8f516": { "sysId": "3ad18693db92220004997878f0b8f516", "displayValue": "Benchmark Client", "value": "sn_bm_client" }, "1bc6c2d3db92220004997878f0b8f571": { "sysId": "1bc6c2d3db92220004997878f0b8f571", "displayValue": "Benchmark Common", "value": "sn_bm_common" }, "de0be0e15bb00300514d484c11f91a4b": { "sysId": "de0be0e15bb00300514d484c11f91a4b", "displayValue": "Benchmarks Spoke", "value": "sn_bm_spoke" }, "18351d53eb32120034d1eeea1206fe79": { "sysId": "18351d53eb32120034d1eeea1206fe79", "displayValue": "Change Management - CAB Workbench", "value": "sn_change_cab" }, "cdcf033467020300b410afa00585ef2b": { "sysId": "cdcf033467020300b410afa00585ef2b", "displayValue": "Change Management - Change Schedule", "value": "sn_chg_soc" }, "1ae06f355710130034d169202d94f92e": { "sysId": "1ae06f355710130034d169202d94f92e", "displayValue": "Change Management - Color Picker", "value": "sn_chg_soc_cp" }, "f9752f20d7120200b6bddb0c8252032e": { "sysId": "f9752f20d7120200b6bddb0c8252032e", "displayValue": "Code Search", "value": "sn_codesearch" }, "116703c19f200300af7196fcc67fcf17": { "sysId": "116703c19f200300af7196fcc67fcf17", "displayValue": "Connect Spoke", "value": "sn_connect_ah" }, "1ae3c8a3c3221200f25d174292d3aea3": { "sysId": "1ae3c8a3c3221200f25d174292d3aea3", "displayValue": "Delegated Dev User Administration", "value": "sn_dd_user_admin" }, "dc1fcaa2c3032200f7d1ca3adfba8f1a": { "sysId": "dc1fcaa2c3032200f7d1ca3adfba8f1a", "displayValue": "Enhanced Global Search UI", "value": "sn_global_searchui" }, "801cef500b312200c438ee6537673a04": { "sysId": "801cef500b312200c438ee6537673a04", "displayValue": "Flow-Action Designer", "value": "sn_flow_designer" }, "global": { "sysId": "global", "displayValue": "Global", "value": "global" }, "5f4ef4ed9f401200b18a7feea57fcfbe": { "sysId": "5f4ef4ed9f401200b18a7feea57fcfbe", "displayValue": "Guided Setup", "value": "sn_guided_setup" }, "7f1c13c0731103005e7d234ffff6a7da": { "sysId": "7f1c13c0731103005e7d234ffff6a7da", "displayValue": "ITSM Spoke", "value": "sn_itsm_spoke" }, "dd9d31505f221200c438ef50ff4666de": { "sysId": "dd9d31505f221200c438ef50ff4666de", "displayValue": "JavaScript Debugger", "value": "sn_jsdebugger" }, "2efa4be5db0003004d27b31be0b8f5e9": { "sysId": "2efa4be5db0003004d27b31be0b8f5e9", "displayValue": "Major Incident Management", "value": "sn_major_inc_mgmt" }, "fae90fb35f6b03006ae6a184ff46667a": { "sysId": "fae90fb35f6b03006ae6a184ff46667a", "displayValue": "Major workbench components", "value": "sn_major_workbench" }, "b2881e900b3003001e684ac3b6673a93": { "sysId": "b2881e900b3003001e684ac3b6673a93", "displayValue": "Performance Analytics - Diagnostics", "value": "sn_pa_diagnostics" }, "1c3f9f936741030032468aaad485efda": { "sysId": "1c3f9f936741030032468aaad485efda", "displayValue": "Performance Analytics - Enhanced UI", "value": "sn_pa_ui" }, "9a31657653373200e8960ef5d5dc34d5": { "sysId": "9a31657653373200e8960ef5d5dc34d5", "displayValue": "Schedule Pages", "value": "sn_schedule_pages" }, "893ea311d71321004f6a0eca5e6103e6": { "sysId": "893ea311d71321004f6a0eca5e6103e6", "displayValue": "Scoped App Author", "value": "sn_appauthor" }, "781f36a96fef21005be8883e6b3ee43d": { "sysId": "781f36a96fef21005be8883e6b3ee43d", "displayValue": "Scoped App Client", "value": "sn_appclient" }, "0aa1393093213100ae6e941e867ffb40": { "sysId": "0aa1393093213100ae6e941e867ffb40", "displayValue": "Scoped App Creator", "value": "sn_appcreator" }, "6e70d1f5c32302006f333b0ac3d3ae7b": { "sysId": "6e70d1f5c32302006f333b0ac3d3ae7b", "displayValue": "Service Catalog REST API", "value": "sn_sc" }, "6c11c4f357201300ff01ac11ac94f982": { "sysId": "6c11c4f357201300ff01ac11ac94f982", "displayValue": "Service Level Management - Breakdowns", "value": "sn_sla_brkdwn" }, "67ac5062db10220035417878f0b8f5c4": { "sysId": "67ac5062db10220035417878f0b8f5c4", "displayValue": "Service Portal Surveys", "value": "sn_portal_surveys" }, "97515a49134b5200ed373d62f244b04a": { "sysId": "97515a49134b5200ed373d62f244b04a", "displayValue": "ServiceNow Guided Tour Designer", "value": "sn_tourbuilder" }, "11722b01473231007f47563dbb9a7154": { "sysId": "11722b01473231007f47563dbb9a7154", "displayValue": "Social Knowledge", "value": "sn_kb_social_qa" }, "5d9789f3eb51310007e48c1cf106fe9e": { "sysId": "5d9789f3eb51310007e48c1cf106fe9e", "displayValue": "Studio", "value": "sn_devstudio" }, "0fdd6483d72302004f1e82285e61033a": { "sysId": "0fdd6483d72302004f1e82285e61033a", "displayValue": "Targeted Communications", "value": "sn_publications" }, "8dfe92d95373030029200ef5d5dc348a": { "sysId": "8dfe92d95373030029200ef5d5dc348a", "displayValue": "Task Communications Management", "value": "sn_comm_management" }, "46aa60c2ff10020014ecffffffffffa5": { "sysId": "46aa60c2ff10020014ecffffffffffa5", "displayValue": "Twilio Driver", "value": "sn_twilio_driver" }, "9353f56fb33332000abf86d256a8dce9": { "sysId": "9353f56fb33332000abf86d256a8dce9", "displayValue": "Visual Task Board (VTB) Spoke", "value": "sn_vtb_ah" }, "0f6ab99a0f36060094f3c09ce1050ee8": { "sysId": "0f6ab99a0f36060094f3c09ce1050ee8", "displayValue": "[ws] Xplore: Developer Toolkit", "value": "global" } };
    exports.SAMPLE_CSS = `.blue-border {
	border: 1px solid blue;
}
`;
    exports.SAMPLE_HTML = `<div class="blue-border">
	<my-sample-component></my-sample-component>
</div>
`;
});
define("recordWatcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function RecordWatcher() {
        let amb;
        if (typeof g_ambClient != 'undefined')
            amb = g_ambClient;
        else if (window.top['g_ambClient'])
            amb = window.top['g_ambClient'];
        if (!amb)
            return;
        var watcherChannel;
        var connected = false;
        var diagnosticLog = true;
        function getFilterString(filter) {
            if (typeof filter != 'string')
                return '';
            filter = filter.
                replace(/\^EQ/g, '').
                replace(/\^ORDERBY(?:DESC)?[^^]*/g, '').
                replace(/^GOTO/, '');
            return btoa(filter).replace(/=/g, '-');
        }
        function getChannel(channel) {
            return amb.getChannel(channel);
        }
        function getChannelRW(table, filter) {
            var t = '/rw/default/' + table + '/' + getFilterString(filter || "");
            return amb.getChannel(t);
        }
        function initWatcher(table, sys_id, query = "sys_idISNOTEMPTY") {
            if (!table)
                return;
            var filter = '';
            if (sys_id)
                filter = "sys_id=" + sys_id;
            else
                filter = query;
            if (!filter)
                filter = "sys_idISNOTEMPTY";
            return initChannel(table, filter);
        }
        function initList(table, query) {
            if (!table)
                return;
            query = query || "sys_idISNOTEMPTY";
            return initChannel(table, query);
        }
        function initTaskList(list, prevChannel) {
            if (prevChannel)
                prevChannel.unsubscribe();
            var sys_ids = list.toString();
            var filter = "sys_idIN" + sys_ids;
            return initChannel("task", filter);
        }
        function initChannel(table, filter = "sys_idISNOTEMPTY") {
            if (isBlockedTable(table)) {
                log("Blocked from watching", table);
                return null;
            }
            if (diagnosticLog)
                log(">>> init " + table + "?" + filter);
            watcherChannel = getChannelRW(table, filter);
            watcherChannel.subscribe(onMessage);
            amb.connect();
            return watcherChannel;
        }
        function onMessage(message) {
            var r = message.data;
            var c = message.channel;
            if (diagnosticLog)
                log(r);
        }
        function log(...messages) {
            console.log(messages.join("\s"));
        }
        function isBlockedTable(table) {
            return table == 'sys_amb_message' || table.startsWith('sys_rw');
        }
        return {
            getChannel: getChannel,
            initTaskList: initTaskList,
            initChannel: initChannel,
            init: function (table, sys_id, query = "") {
                initWatcher(table, sys_id, query);
            },
            initList: initList,
            initRecord: function (table, sysId) {
                initWatcher(table, sysId, "");
            }
        };
    }
    exports.RecordWatcher = RecordWatcher;
    ;
});
define("debugPointManager", ["require", "exports", "codenowUtils", "recordWatcher", "constants"], function (require, exports, codenowUtils_1, recordWatcher_1, constants_1) {
    "use strict";
    var _isServiceNow;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugPointOperation = {
        add: 'add',
        update: 'update',
        delete: 'delete'
    };
    class DebugPointModifier {
        constructor(tableName, sysId, fieldName = 'script') {
            this.tableName = tableName;
            this.sysId = sysId;
            this.fieldName = fieldName;
            this.ToBeAdded = new Map();
            this.ToBeDeleted = new Map();
            this.toBeUpdated = new Map();
        }
        geTemplate(lineNumber, operation, evaluationString = '') {
            return {
                fieldName: this.fieldName,
                lineNumber,
                debugpointType: 'breakpoint',
                operation,
                scriptId: this.sysId,
                tableName: this.tableName,
                evaluationString
            };
        }
        isSourceMapAvailable() {
            return !!this.sourceMapValue;
        }
        getSourceMap() {
            return this.sourceMapValue;
        }
        getSourceMapFileName() {
            return this.sourceMapFileName;
        }
        updateSourceMap(newSourceMap, sourceMapFileName) {
            this.sourceMapValue = newSourceMap;
            this.sourceMapFileName = sourceMapFileName;
        }
        update(lineNo, newEvaluationString = '') {
            this.toBeUpdated.set(lineNo, this.geTemplate(lineNo, exports.DebugPointOperation.update, newEvaluationString));
        }
        getLineModel(line) {
            return this.ToBeDeleted.get(line) || this.toBeUpdated.get(line) || this.ToBeAdded.get(line);
        }
        isInAddList(line) {
            return !!this.ToBeAdded.get(line);
        }
        isInUpdatedList(line) {
            return !!this.toBeUpdated.get(line);
        }
        isInDeleteList(line) {
            return !!this.ToBeDeleted.get(line);
        }
        getModelFromAddList(line) {
            return this.ToBeAdded.get(line);
        }
        getModelFromUpdateList(line) {
            return this.toBeUpdated.get(line);
        }
        getModelFromDeleteList(line) {
            return this.ToBeDeleted.get(line);
        }
        removeFromAddList(line) {
            if (!this.ToBeAdded.get(line))
                return false;
            this.ToBeAdded.delete(line);
            return true;
        }
        removeFromUpdateList(line) {
            if (!this.toBeUpdated.get(line))
                return false;
            this.toBeUpdated.delete(line);
            return true;
        }
        removeFromDeleteList(line) {
            if (!this.ToBeDeleted.get(line))
                return false;
            this.ToBeDeleted.delete(line);
            return true;
        }
        add(lineNo, evaluationString = '') {
            if (this.ToBeAdded.has(lineNo)) {
                this.ToBeAdded.delete(lineNo);
                this.update(lineNo, evaluationString);
                return;
            }
            const item = this.geTemplate(lineNo, exports.DebugPointOperation.add, evaluationString);
            this.ToBeAdded.set(lineNo, item);
        }
        delete(lineNo) {
            this.ToBeDeleted.set(lineNo, this.geTemplate(lineNo, exports.DebugPointOperation.delete));
        }
        getPayload() {
            return __awaiter(this, void 0, void 0, function* () {
                return [...this.ToBeDeleted.values(), ...this.toBeUpdated.values(), ...this.ToBeAdded.values()];
            });
        }
    }
    exports.DebugPointModifier = DebugPointModifier;
    class DebugPointManager {
        constructor() {
            this.fetchImmediateOnRecordChange = false;
            _isServiceNow.set(this, void 0);
            __classPrivateFieldSet(this, _isServiceNow, typeof window.g_ck === 'string');
        }
        getDebugPointModifer(tableName, sysId, fieldName) {
            return new DebugPointModifier(tableName, sysId, fieldName);
        }
        static get() {
            if (DebugPointManager.instance)
                return DebugPointManager.instance;
            DebugPointManager.instance = new DebugPointManager();
            DebugPointManager.fieldSourceMaps = new Map();
            return DebugPointManager.instance;
        }
        refreshDebugPointCache() {
            return __awaiter(this, void 0, void 0, function* () {
                this.fetcherPromise = null;
                yield this.loadAllDebugPoints();
                const e = new Event(constants_1.DEBUG_POINTS_MODIFIED_EVENT);
                document.dispatchEvent(e);
            });
        }
        initializeWatcher(sysIds) {
            if (!__classPrivateFieldGet(this, _isServiceNow))
                return;
            let filter = 'script_id=';
            if (Array.isArray(sysIds))
                filter += sysIds.join('^ORscript_id=');
            else
                filter += sysIds;
            if (this.previousFilter === filter)
                return;
            if (this.unsubscribe)
                this.unsubscribe();
            const breakPointsChannel = recordWatcher_1.RecordWatcher();
            let breakPointDebounceTimer = -1;
            this.unsubscribe = breakPointsChannel.initChannel("sys_js_breakpoint", filter).subscribe(() => {
                if (breakPointDebounceTimer !== -1)
                    window.clearTimeout(breakPointDebounceTimer);
                breakPointDebounceTimer = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    if (this.fetchImmediateOnRecordChange) {
                        this.fetchImmediateOnRecordChange = false;
                        return;
                    }
                    yield this.refreshDebugPointCache();
                }), this.fetchImmediateOnRecordChange ? 1000 : 5000);
            });
        }
        getJSLine(lineNumbers, isTS = false) {
            if (!window.recordConfig.isES6 || !this.sourcemapConsumer)
                return Promise.resolve(lineNumbers);
            if (!Array.isArray(lineNumbers))
                return Promise.resolve([]);
            const fileName = `point.${isTS ? 'ts' : 'js'}`;
            const jsLines = [];
            lineNumbers.forEach((line) => {
                const position = this.sourcemapConsumer.generatedPositionFor({
                    source: fileName,
                    line: line,
                    column: 1,
                    bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
                });
                if (!position)
                    jsLines.push(position.line);
            });
            return Promise.resolve(jsLines);
        }
        getTSLine(jsLineNumbers, isTS = false) {
            if (!window.recordConfig.isES6 || !this.sourcemapConsumer)
                return Promise.resolve(jsLineNumbers);
            if (!Array.isArray(jsLineNumbers))
                return Promise.resolve([]);
            const fileName = `point.${isTS ? 'ts' : 'js'}`;
            let tsLines = [];
            jsLineNumbers.forEach((jsline) => {
                const result = this.sourcemapConsumer.originalPositionFor({
                    line: jsline,
                    column: 1,
                    bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
                });
                if (!result)
                    tsLines.push(result.line);
            });
            return Promise.resolve(tsLines);
        }
        applySourceMap(field, transpiledField) {
            return __awaiter(this, void 0, void 0, function* () {
                const sourceMapJSON = transpiledField.sourcemap;
                this.sourcemapConsumer = null;
                if (typeof sourceMap === 'undefined')
                    return Promise.resolve(undefined);
                if (typeof sourceMapJSON !== 'string' || sourceMapJSON.length === 0)
                    return Promise.reject(undefined);
                let consumer = null;
                try {
                    consumer = yield new sourceMap.SourceMapConsumer(JSON.parse(sourceMapJSON));
                }
                catch (e) {
                    this.sourcemapConsumer = null;
                    let prevValue = DebugPointManager.fieldSourceMaps.get(field.fileName);
                    prevValue.consumer = null;
                    consumer = null;
                }
                DebugPointManager.fieldSourceMaps.set(field.fileName, { field, transpiledField, consumer });
                return Promise.resolve(consumer);
            });
        }
        loadAllDebugPoints() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!__classPrivateFieldGet(this, _isServiceNow))
                    return Promise.resolve({});
                if (this.fetcherPromise)
                    return this.fetcherPromise;
                this.fetcherPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    const { result } = yield codenowUtils_1.CodeNowUtils.snFetch('/api/now/js/debugger/scripts');
                    for (const key in result) {
                        result[key].debugpoints = result[key].debugpoints || {};
                        result[key].debugpoints.BREAKPOINT = result[key].debugpoints.BREAKPOINT || {};
                    }
                    this.debugPointServerState = result;
                    resolve(result);
                }));
                return this.fetcherPromise;
            });
        }
        getDebugLineNumbers(key) {
            let resp = this.getDebugPoints(key);
            if (!resp)
                return [];
            return Object.keys(resp.debugpoints.BREAKPOINT).map((line) => {
                return parseInt(line);
            });
        }
        getDebugPointsFromMonacoField(field) {
            return this.getDebugPoints(this.getKey(field.tableName, field.sysId, field.name));
        }
        getScriptDebugPointTemplateFromTableSysId(tableName = '', scriptId = '', scriptField = '') {
            return {
                canWrite: true,
                debugpoints: {
                    BREAKPOINT: {}
                },
                key: {
                    scriptField,
                    scriptId,
                    scriptType: tableName,
                    value: this.getKey(tableName, scriptId, scriptField),
                },
                name: '',
                script: ''
            };
        }
        getScriptDebugPointTemplate(key = '') {
            var _a, _b, _c;
            const tokens = key.split('.');
            return this.getScriptDebugPointTemplateFromTableSysId((_a = tokens[0]) !== null && _a !== void 0 ? _a : '', (_b = tokens[1]) !== null && _b !== void 0 ? _b : '', (_c = tokens[2]) !== null && _c !== void 0 ? _c : '');
        }
        getDebugPoints(key) {
            var _a;
            const item = this.getScriptDebugPointTemplate(key);
            if (!__classPrivateFieldGet(this, _isServiceNow))
                return item;
            if (!this.debugPointServerState)
                return item;
            return (_a = this.debugPointServerState[key]) !== null && _a !== void 0 ? _a : item;
        }
        getDebugPointForLineFromKey(key, line) {
            var _a, _b;
            let state = this.getDebugPoints(key);
            return (_b = (_a = state === null || state === void 0 ? void 0 : state.debugpoints) === null || _a === void 0 ? void 0 : _a.BREAKPOINT) === null || _b === void 0 ? void 0 : _b[line];
        }
        getDebugPointForLine(field, line) {
            return this.getDebugPointForLineFromKey(this.getKey(field.tableName, field.sysId, field.name), line);
        }
        getKey(table, sysId, fieldName) {
            return `${table}.${sysId}.${fieldName}`;
        }
        getKeyFromMonacoField(field) {
            return this.getKey(field.tableName, field.sysId, field.name);
        }
        loadDebugPoints(table, sysId, fieldName) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!__classPrivateFieldGet(this, _isServiceNow))
                    return Promise.resolve(this.getScriptDebugPointTemplateFromTableSysId(table, sysId, fieldName));
                const { result } = yield codenowUtils_1.CodeNowUtils.snFetch(`api/now/js/debugpoints/script/${table}/${sysId}/${fieldName}`);
                result.debugpoints = result.debugpoints || {};
                result.debugpoints.BREAKPOINT = result.debugpoints.BREAKPOINT || {};
                this.debugPointServerState = this.debugPointServerState || {};
                this.debugPointServerState[result.key.value] = result;
                return Promise.resolve(result);
            });
        }
        toggleDebugPointFromMonacoField(field, line, evaluationString, column = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!__classPrivateFieldGet(this, _isServiceNow))
                    return Promise.resolve(this.getScriptDebugPointTemplateFromTableSysId(field.tableName, field.sysId, field.name));
                return this.toggleDebugPoint(field.tableName, field.sysId, field.name, line, evaluationString, column);
            });
        }
        toggleDebugPoint(table, sysId, field, line, evaluationString, column = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!__classPrivateFieldGet(this, _isServiceNow))
                    return Promise.resolve(this.getScriptDebugPointTemplateFromTableSysId(table, sysId, field));
                const url = `api/now/js/debugger/breakpoint/${table}/${sysId}/${field}/${line}`;
                const body = {};
                const key = this.getKey(table, sysId, field);
                if (this.debugPointServerState[key]) {
                    if (!this.debugPointServerState[key].debugpoints.BREAKPOINT[line])
                        body.evaluationString = '';
                }
                else if (typeof evaluationString === 'string')
                    body.evaluationString = evaluationString;
                yield codenowUtils_1.CodeNowUtils.snFetch(url, {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                this.fetchImmediateOnRecordChange = true;
                return this.loadDebugPoints(table, sysId, field);
            });
        }
        updateDebugPoints(debugPointModifier) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!__classPrivateFieldGet(this, _isServiceNow))
                    return Promise.resolve({});
                const payload = yield debugPointModifier.getPayload();
                if (payload.length === 0)
                    return Promise.resolve({});
                this.fetchImmediateOnRecordChange = true;
                let result = yield codenowUtils_1.CodeNowUtils.snFetch('api/now/js/debugpoints/process', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }, true);
                const firstItem = payload[0];
                yield this.loadDebugPoints(firstItem.tableName, firstItem.scriptId, firstItem.fieldName);
                Promise.resolve(result);
            });
        }
        startDebugger(table, sysId, field) {
            if (!__classPrivateFieldGet(this, _isServiceNow))
                return;
            var launchFunction;
            if (typeof window.top["launchScriptDebugger"] != 'undefined')
                launchFunction = window.top["launchScriptDebugger"];
            else if (window.top.opener && window.top.opener.top.launchScriptDebugger)
                launchFunction = window.top.opener.top.launchScriptDebugger;
            if (typeof launchFunction !== 'undefined' && typeof g_form !== 'undefined') {
                launchFunction(table, sysId);
                return;
            }
            function _launch() {
                var width = window.innerWidth - 40, height = window.innerHeight, x = window.screenX + 20, y = window.screenY + 20, features = 'width=' + width + ',height=' + height + ',toolbar=no,status=no,directories=no,menubar=no,resizable=yes,screenX=' + x + ',left=' + x + ',screenY=' + y + ',top=' + y;
                var debuggerWind = window.open('', 'sn_ScriptDebugger', features, false), prevFullUrl = debuggerWind.location.href, reload = false;
                if (prevFullUrl === 'about:blank') {
                    // Debugger doesn't exist or is opened by other window (can't get reference)
                    try {
                        var storedTime = parseInt(localStorage.getItem('sn_ScriptDebugger')), currentTime = new Date().getTime();
                        if (storedTime && 60000 > currentTime - storedTime) {
                            // Debugger exists - Most recent storedTime is within one Interval of setting localStorage
                            debuggerWind.close();
                            localStorage.setItem('sn_ScriptDebuggerExist_ShowNotification', new Date().getTime() + '');
                            return;
                        }
                    }
                    catch (e) {
                        // consoel.log(e);
                    }
                    reload = true; //debugger window doesn't exist
                }
                var url = '/$jsdebugger.do?sysparm_nostack=true';
                if (sysId && table && field) {
                    url = '/$jsdebugger.do?scriptId=' + sysId + '&scriptType=' + table + '&scriptField=' + field + '&sysparm_nostack=true';
                    if (!reload) {
                        //Debugger window is open
                        try {
                            localStorage.setItem('sn_ScriptDebugger_url', url);
                        }
                        catch (e) {
                            var prevUrl = prevFullUrl.slice(prevFullUrl.indexOf('$jsdebugger.do'));
                            if (prevUrl != url)
                                reload = true;
                        }
                    }
                }
                if (reload) {
                    debuggerWind = window.open(url, 'sn_ScriptDebugger', features, false);
                }
                debuggerWind.focus();
                debuggerWind.setTimeout(focus, 1);
            }
            try {
                _launch();
            }
            catch (e) {
                //	console.log(e);
            }
        }
    }
    exports.DebugPointManager = DebugPointManager;
    _isServiceNow = new WeakMap();
});
define("eslintConfig", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ruleSetting;
    (function (ruleSetting) {
        ruleSetting[ruleSetting["off"] = 0] = "off";
        ruleSetting[ruleSetting["warn"] = 1] = "warn";
        ruleSetting[ruleSetting["error"] = 2] = "error";
    })(ruleSetting = exports.ruleSetting || (exports.ruleSetting = {}));
    exports.eslintConfig = {
        "parserOptions": {
            "ecmaVersion": 5,
            "sourceType": "script",
            "ecmaFeatures": {}
        },
        "rules": {
            "constructor-super": 2,
            "for-direction": 2,
            "getter-return": 2,
            "no-case-declarations": 2,
            "no-class-assign": 2,
            "no-compare-neg-zero": 2,
            "no-cond-assign": 2,
            "no-console": 2,
            "no-const-assign": 2,
            "no-constant-condition": 2,
            "no-control-regex": 2,
            "no-debugger": 2,
            "no-delete-var": 2,
            "no-dupe-args": 2,
            "no-dupe-class-members": 2,
            "no-dupe-keys": 2,
            "no-duplicate-case": 2,
            "no-empty": 2,
            "no-empty-character-class": 2,
            "no-empty-pattern": 2,
            "no-ex-assign": 2,
            "no-extra-boolean-cast": 2,
            "no-extra-semi": 2,
            "no-fallthrough": 2,
            "no-func-assign": 2,
            "no-global-assign": 2,
            "no-inner-declarations": 2,
            "no-invalid-regexp": 2,
            "no-irregular-whitespace": 2,
            "no-mixed-spaces-and-tabs": 2,
            "no-new-symbol": 2,
            "no-obj-calls": 2,
            "no-octal": 2,
            "no-redeclare": 2,
            "no-regex-spaces": 2,
            "no-self-assign": 2,
            "no-sparse-arrays": 2,
            "no-this-before-super": 2,
            "no-unexpected-multiline": 2,
            "no-unreachable": 2,
            "no-unsafe-finally": 2,
            "no-unsafe-negation": 2,
            "no-unused-labels": 2,
            "no-unused-vars": 2,
            "no-useless-escape": 2,
            "require-yield": 2,
            "use-isnan": 2,
            "valid-typeof": 2,
            "semi": 2,
            "semi-spacing": 2,
            "semi-style": 2,
            "eqeqeq": 2,
            "eol-last": 2,
            "default-case": 2,
            "consistent-return": 2,
            "camelcase": 2,
            "no-else-return": 2,
            "no-eq-null": 2,
            "no-eval": 2,
            "no-extend-native": 2,
            "no-extra-bind": 2,
            "no-self-compare": 2,
            "no-unused-expressions": 2
        },
        "env": {
            "browser": true
        }
    };
});
define("schemaParser", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChoiceType;
    (function (ChoiceType) {
        ChoiceType["Unknown"] = "0";
        ChoiceType["WithNull"] = "1";
        ChoiceType["DefaultString"] = "2";
        ChoiceType["WithoutNull"] = "3";
    })(ChoiceType || (ChoiceType = {}));
    class SchemaDTSGenerator {
        static generate(tableMap, choicePayload, isScoped = false) {
            var _a, _b, _c, _d, _e;
            function convertTableName(tableName) {
                const newTable = tableName.replace(/(^[a-zA-Z])|(_)([a-zA-Z]?)/g, (match, $0, $1, $2) => {
                    if (!!$1) {
                        if (!!$2)
                            return $2.toUpperCase();
                        return $1;
                    }
                    return $0.toUpperCase();
                });
                return {
                    name: tableName,
                    GR: newTable + 'GR',
                    GRS: newTable + 'GRS',
                    GA: newTable + 'GA',
                    FGR: newTable + 'FGR',
                };
            }
            const grTypes = new Map();
            const processedTables = new Set();
            const processedChoiceFields = new Map();
            const choiceFieldMap = {};
            for (const tableName in choicePayload) {
                let table = tableMap[tableName];
                if (!table)
                    continue;
                const tableStack = [];
                do {
                    tableStack.push(table.name);
                    const base = (_a = table.base) !== null && _a !== void 0 ? _a : '';
                    if (base.length === 0)
                        break;
                    table = tableMap[base];
                } while (table);
                do {
                    let currentTableName = tableStack.pop();
                    let currentChoiceTable = choicePayload[currentTableName];
                    if (processedTables.has(currentTableName))
                        continue;
                    let currentTable = tableMap[currentTableName];
                    processedTables.add(currentTableName);
                    const baseTableName = (_c = (_b = tableMap[currentTableName]) === null || _b === void 0 ? void 0 : _b.base) !== null && _c !== void 0 ? _c : "";
                    for (const fieldName in currentChoiceTable) {
                        const choiceFieldKey = `${currentTableName}_${fieldName}`;
                        if (processedChoiceFields.has(choiceFieldKey))
                            continue;
                        const subType = (_d = currentTable.fields[fieldName]) === null || _d === void 0 ? void 0 : _d.subType;
                        const currentChoiceField = {
                            name: fieldName,
                            subType: subType !== null && subType !== void 0 ? subType : ChoiceType.WithNull,
                            type: 'choice',
                            values: [...currentChoiceTable[fieldName]]
                        };
                        if (baseTableName.length > 0) {
                            const baseFieldKey = `${baseTableName}_${fieldName}`;
                            if (processedChoiceFields.has(baseFieldKey)) {
                                const baseField = processedChoiceFields.get(baseFieldKey);
                                if (baseField) {
                                    currentChoiceField.values = [...currentChoiceField.values, ...baseField.values];
                                    currentChoiceField.subType = subType !== null && subType !== void 0 ? subType : baseField.subType;
                                }
                            }
                        }
                        if (!choiceFieldMap[currentTableName])
                            choiceFieldMap[currentTableName] = {};
                        choiceFieldMap[currentTableName][currentChoiceField.name] = currentChoiceField;
                        processedChoiceFields.set(choiceFieldKey, currentChoiceField);
                    }
                } while (tableStack.length > 0);
            }
            function getFieldType(field, table) {
                if (isScoped) {
                    switch (field.type) {
                        case 'choice':
                            return `GlideElementChoice<T, GRT, '${table.name}_${field.name}'>`;
                        case 'reference':
                            return `GlideElement<T, GRT, '${field.ref}'> & SchemaOf<'${field.ref}', GRT>`;
                    }
                    return `GlideElement<T, GRT>`;
                }
                switch (field.type) {
                    case 'boolean':
                        return `GlideElementBoolean<T, GRT>`;
                    case 'float':
                    case 'integer':
                    case 'decimal':
                    case 'auto_increment':
                    case 'percent_complete':
                    case 'price':
                    case 'repeat_count':
                    case 'schedule_interval_count':
                        return `GlideElementNumeric<T, GRT>`;
                    case 'reference':
                        return `GlideElementReference<T, '${field.ref}', GRT> & SchemaOf<'${field.ref}', GRT>`;
                    case 'script':
                    case 'script_plain':
                    case 'script_server':
                    case 'xml':
                        return `GlideElementScript<T, GRT>`;
                    case 'calendar_date_time':
                        return `GlideElementGlideObject<T, GlideCalendarDateTime, GRT>`;
                    case 'currency':
                        return `GlideElementCurrency<T, GRT>`;
                    case 'currency2':
                        return `GlideElementCurrency2<T, GRT>`;
                    case 'data_structure':
                        return 'GlideElementGlideObject<T, GlideElementDataStructure, GRT>';
                    case 'data_array':
                        return `GlideElementDataArray<T, GRT>`;
                    case 'data_object':
                        return `GlideElementDataObject<T, GRT>`;
                    case 'date':
                        return 'GlideElementGlideObject<T, Date, GRT>';
                    case 'datetime':
                        return 'GlideElementGlideObject<T, GlideElementDataStructure, GRT>';
                    case 'documentation_field':
                        return `GlideElementTranslatedField<T, GRT>`;
                    case 'document_id':
                        return `GlideElementDocumentId<T, GRT>`;
                    case 'domain_id':
                        return `GlideElementDomainId<T, GRT>`;
                    case 'due_date':
                    case 'glide_date_time':
                        return `GlideElementGlideObject<T, GlideDateTime, GRT>`;
                    case 'glide_action_list':
                        return `GlideElementGlideObject<T, GlideActionList, GRT>`;
                    case 'glide_date':
                        return `GlideElementGlideObject<T, GlideDate, GRT>`;
                    case 'glide_duration':
                    case 'timer':
                        return `GlideElementGlideObject<T, GlideDuration, GRT>`;
                    case 'glide_list':
                        return `GlideElementGlideObject<T, GlideList, GRT>`;
                    case 'glide_precise_time':
                        return `GlideElementGlideObject<T, GlidePreciseTime, GRT>`;
                    case 'glide_time':
                    case 'glide_utc_time':
                    case 'time':
                        return `GlideElementGlideObject<T, GlideTime, GRT>`;
                    case 'glide_var':
                        return `GlideElementGlideVar<T, GRT>`;
                    case 'integer_date':
                        return `GlideElementGlideObject<T, GlideIntegerDate, GRT>`;
                    case 'integer_time':
                        return `GlideElementGlideObject<T, GlideIntegerTime, GRT>`;
                    case 'internal_type':
                        return `GlideElementInternalType<T, GRT>`;
                    case 'journal':
                    case 'journal_input':
                    case 'journal_list':
                        return `GlideElementGlideObject<T, null, GRT>`;
                    case 'month_of_year':
                        return `GlideElementGlideObject<T, null, GRT>`;
                    case 'password':
                        return `GlideElementPassword<T, GRT>`;
                    case 'password2':
                        return `GlideElementPassword2<T, GRT>`;
                    case 'phone_number_e164':
                        return 'GlideElementPhoneNumber<T, GRT>';
                    case 'schedule_date_time':
                        return `GlideElementGlideObject<T, GlideScheduleDateTime, GRT>`;
                    case 'short_field_name':
                        return `GlideElementShortFieldName<T, GRT>`;
                    case 'short_table_name':
                        return `GlideElementShortTableName<T, GRT>`;
                    case `simple_name_values`:
                        return `GlideElementSimpleNameValue<T, GRT>`;
                    case 'source_id':
                        return `GlideElementSourceId<T, GRT>`;
                    case 'source_name':
                        return `GlideElementSourceName<T, GRT>`;
                    case 'source_table':
                        return `GlideElementSourceTable<T, GRT>`;
                    case 'template_value':
                        return `GlideElementWorkflowConditions<T, GRT>`;
                    case 'translated_field':
                        return `GlideElementTranslatedField<T, GRT>`;
                    case 'video':
                        return `GlideElementVideo<T, GRT>`;
                    case 'wiki_text':
                        return `GlideElementWikiText<T, GRT>`;
                    case 'breakdown_element':
                        return `GlideElementBreakdownElement<T, GRT>`;
                    case 'sys_class_name':
                        return `GlideElementSysClassName<T, GRT>`;
                    case 'choice':
                        return `GlideElementChoice<T, GRT, '${table.name}_${field.name}'>`;
                }
                return `GlideElement<T, GRT>`;
            }
            let choiceDTSMap = new Map();
            function getChoiceDTS(field, table) {
                const interfaceName = `${table.name}_${field.name}`;
                let values = [...field.values];
                if (values.length > 0 && field.subType === ChoiceType.WithNull)
                    values.push({ value: `"NULL"`, displayValue: 'NULL' });
                let dts = [];
                values.forEach((choice) => {
                    if (choice.value.length === 0)
                        return;
                    dts.push(`\n\t'${choice.value}': 1`);
                });
                const dtsValue = `interface ${interfaceName} {
					${dts.join(',')}
				}`;
                choiceDTSMap.set(interfaceName, dtsValue);
            }
            function getMarkdownForChoice(field) {
                if (field.type !== 'choice')
                    return '';
                const uniqueSet = new Set();
                let choiceMD = '\t/**\n';
                field.values.forEach((val) => {
                    if (uniqueSet.has(val.value))
                        return;
                    uniqueSet.add(val.value);
                    choiceMD += `\t * + "${val.value}" - ${val.displayValue}\n`;
                });
                choiceMD += '\t */';
                return choiceMD;
            }
            function getFieldsDTS(table) {
                let fieldDTS = '';
                if (choiceFieldMap[table.name])
                    table.fields = Object.assign(Object.assign({}, table.fields), choiceFieldMap[table.name]);
                for (const fieldName in table.fields) {
                    const field = table.fields[fieldName];
                    if (fieldName.length > 0) {
                        let itemStr = `${fieldName}: ${getFieldType(field, table)},\n\t`;
                        if (field.type === 'choice') {
                            if (!Array.isArray(field.values))
                                field.values = [];
                            const choiceMarkDown = getMarkdownForChoice(field);
                            if (choiceMarkDown.length > 0)
                                itemStr = `${choiceMarkDown}\n\t${itemStr}`;
                            getChoiceDTS(field, table);
                        }
                        fieldDTS += itemStr;
                    }
                    else
                        fieldDTS += `//\t: ${getFieldType(field, table)},\n\t`;
                }
                return fieldDTS;
            }
            function getTemplateLiteral(name) {
                return `<T extends keyof MyTables = '${name}', GRT extends SnGRTypes = GR>`;
            }
            function getSoloInterface(item) {
                return `interface ${item.name} ${getTemplateLiteral(item.name)} {
				${getFieldsDTS(item)}
			}`;
            }
            function getExtendedInterface(item) {
                var _a;
                return `interface ${item.name} ${getTemplateLiteral(item.name)} extends ${(_a = item.base) !== null && _a !== void 0 ? _a : ''}<T, GRT> {
				${getFieldsDTS(item)}
			}`;
            }
            let dts = ``;
            let myTablesDTS = ``;
            for (const tableName in tableMap) {
                grTypes.set(tableName, convertTableName(tableName));
                myTablesDTS += `${tableName}: ${tableName}<'${tableName}', T>,\n\t`;
                let obj = tableMap[tableName];
                let base = (_e = obj.base) !== null && _e !== void 0 ? _e : "";
                if (base.length === 0)
                    dts += getSoloInterface(obj) + '\n';
                else
                    dts += getExtendedInterface(obj) + '\n';
            }
            myTablesDTS = `\ninterface MyTables<T extends SnGRTypes = GR> {
			${myTablesDTS}
		}`;
            let choiceDTS = '';
            let MyChoices = ``;
            choiceDTSMap.forEach((val, key) => {
                choiceDTS += val + '\n';
                MyChoices += `\t${key}: ${key},\n`;
            });
            MyChoices = `interface MyChoices {
			${MyChoices}
		}`;
            let grNames = ``;
            grTypes.forEach((val) => {
                grNames += `
			type ${val.GR} = SnTableGR<'${val.name}'>;
			type ${val.GRS} = SnTableGRS<'${val.name}'>;
			type ${val.GA} = SnTableGA<'${val.name}'>;
			`;
                if (!isScoped)
                    grNames += `type ${val.FGR} = SnTableFGR<'${val.name}'>;`;
            });
            return `${dts}\n${myTablesDTS}\n${choiceDTS}\n${MyChoices}\n${grNames}`;
        }
    }
    exports.SchemaDTSGenerator = SchemaDTSGenerator;
});
define("siParser", ["require", "exports", "eslintConfig", "constants", "schemaParser"], function (require, exports, linterConfig, constants_2, schemaParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    linterConfig = __importStar(linterConfig);
    var JSExportedTypes;
    (function (JSExportedTypes) {
        JSExportedTypes["never"] = "never";
        JSExportedTypes["var"] = "var";
        JSExportedTypes["fun"] = "fun";
        JSExportedTypes["cls"] = "cls";
    })(JSExportedTypes = exports.JSExportedTypes || (exports.JSExportedTypes = {}));
    ;
    var BlockedSI;
    (function (BlockedSI) {
        BlockedSI[BlockedSI["global.Class"] = 1] = "global.Class";
        BlockedSI[BlockedSI["global.RevertUpdateVersionAjax"] = 2] = "global.RevertUpdateVersionAjax";
        BlockedSI[BlockedSI["global.CSMTableMapUtilSNC"] = 3] = "global.CSMTableMapUtilSNC";
        BlockedSI[BlockedSI["global.__extends"] = 4] = "global.__extends";
        BlockedSI[BlockedSI["global.PrototypeServer"] = 5] = "global.PrototypeServer";
        BlockedSI[BlockedSI["global.CIIdentifier"] = 6] = "global.CIIdentifier";
        BlockedSI[BlockedSI["global.KBProperty"] = 7] = "global.KBProperty";
        BlockedSI[BlockedSI["global.KBUtils"] = 8] = "global.KBUtils";
        BlockedSI[BlockedSI["global.Workflow"] = 9] = "global.Workflow";
        BlockedSI[BlockedSI["global.StorageDataSize"] = 10] = "global.StorageDataSize";
        BlockedSI[BlockedSI["global.ContentPageClone"] = 11] = "global.ContentPageClone";
        BlockedSI[BlockedSI["sn_codesearch.CodeSearch"] = 12] = "sn_codesearch.CodeSearch";
        BlockedSI[BlockedSI["sn_codesearch.CacheBuster"] = 13] = "sn_codesearch.CacheBuster";
        BlockedSI[BlockedSI["sn_codesearch._"] = 14] = "sn_codesearch._";
        BlockedSI[BlockedSI["global.DevExHelpers"] = 15] = "global.DevExHelpers";
        BlockedSI[BlockedSI["global.JSON"] = 16] = "global.JSON";
        BlockedSI[BlockedSI["global.j2js"] = 17] = "global.j2js";
        BlockedSI[BlockedSI["global.CodeNowSIConfig"] = 18] = "global.CodeNowSIConfig";
        BlockedSI[BlockedSI["global.CodeNowConfiguration"] = 19] = "global.CodeNowConfiguration";
        BlockedSI[BlockedSI["ChangeManagementWorkerSNC"] = 20] = "ChangeManagementWorkerSNC";
    })(BlockedSI = exports.BlockedSI || (exports.BlockedSI = {}));
    ;
    var ExpressionType;
    (function (ExpressionType) {
        ExpressionType["VariableDeclaration"] = "VariableDeclaration";
        ExpressionType["VariableDeclarator"] = "VariableDeclarator";
        ExpressionType["ExpressionStatement"] = "ExpressionStatement";
        ExpressionType["AssignmentExpression"] = "AssignmentExpression";
        ExpressionType["Literal"] = "Literal";
        ExpressionType["Identifier"] = "Identifier";
        ExpressionType["FunctionDeclaration"] = "FunctionDeclaration";
        ExpressionType["FunctionExpression"] = "FunctionExpression";
        ExpressionType["ObjectExpression"] = "ObjectExpression";
        ExpressionType["CallExpression"] = "CallExpression";
        ExpressionType["MemberExpression"] = "MemberExpression";
        ExpressionType["ArrayExpression"] = "ArrayExpression";
        ExpressionType["NewExpression"] = "NewExpression";
        ExpressionType["ThisExpression"] = "ThisExpression";
    })(ExpressionType = exports.ExpressionType || (exports.ExpressionType = {}));
    var TokenType;
    (function (TokenType) {
        TokenType["namespace"] = "namespace";
        TokenType["import"] = "import";
        TokenType["export"] = "export";
        TokenType["class"] = "class";
        TokenType["interface"] = "interface";
        TokenType["space"] = " ";
        TokenType["startString"] = "\"";
        TokenType["endString"] = "\"";
        TokenType["new"] = "new";
        TokenType["prototype_1"] = "prototype";
        TokenType["newline"] = "\n";
        TokenType["tab"] = "\t";
        TokenType["blockOpen"] = "{";
        TokenType["blockClose"] = "}";
        TokenType["static"] = "static";
        TokenType["colon"] = ":";
        TokenType["semicolon"] = ";";
        TokenType["any"] = "any";
        TokenType["boolean"] = "boolean";
        TokenType["number"] = "number";
        TokenType["object"] = "object";
        TokenType["string"] = "string";
        TokenType["undefined"] = "undefined";
        TokenType["function"] = "function";
        TokenType["functionOpen"] = "(";
        TokenType["functionClose"] = ")";
        TokenType["comma"] = ",";
        TokenType["dot"] = ".";
        TokenType["extends"] = "extends";
        TokenType["implements"] = "implements";
        TokenType["constructor"] = "new";
        TokenType["typeAdd"] = "Constructor";
        TokenType["var"] = "var";
        TokenType["equal"] = "=";
        TokenType["declare"] = "declare";
        TokenType["const"] = "const";
        TokenType["arrow"] = "=>";
    })(TokenType = exports.TokenType || (exports.TokenType = {}));
    ;
    var SIAccessType;
    (function (SIAccessType) {
        SIAccessType["public"] = "public";
        SIAccessType["package_private"] = "package_private";
    })(SIAccessType = exports.SIAccessType || (exports.SIAccessType = {}));
    var SISysPolicy;
    (function (SISysPolicy) {
        SISysPolicy["read"] = "read";
        SISysPolicy["protected"] = "protected";
        SISysPolicy["nil"] = "";
    })(SISysPolicy = exports.SISysPolicy || (exports.SISysPolicy = {}));
    ;
    exports.ERROR_MSG = `Errors in the source files, use 'F8' or 'shift + F8' to navigate errors in editor`;
    function getDotWalkingRegExp() {
        //let regExp = /\`(.*?)(\${2}{[^\{]+(?=\})\})(.*?)\`/g;
        let regExp = /\`(.*?)(\$\$\{[^\{]+(?=\})\})(.*?)\`/g;
        return regExp;
    }
    exports.getDotWalkingRegExp = getDotWalkingRegExp;
    ;
    class ClientSIRecordData {
        constructor(rec, isNewRecord = false) {
            this.isNewRecord = isNewRecord;
            this.access = SIAccessType.public;
            this.active = false;
            this.jsdoc = false;
            this.api_name = "global";
            this.client_callable = false;
            this.description = "";
            this.name = "";
            this.script = "";
            this.script_type = "";
            this.sys_class_name = "";
            this.sys_updated_by = "";
            this.sys_created_on = "";
            this.sys_id = "";
            this.sys_mod_count = 0;
            this.sys_name = "";
            this.sys_package = {
                link: "",
                value: ""
            };
            this.sys_policy = SISysPolicy.nil;
            this.sys_scope = {
                link: "",
                value: ""
            };
            this.sys_tags = "";
            this.sys_update_name = "";
            this.sys_created_by = "";
            this.sys_updated_on = "";
            this.tsscript = "";
            this.typedeclaration = "";
            this.typesourcemap = "";
            this.parseReturnType = true;
            this._isDirty = true;
            this.parseReturnType = true;
            if (!!rec) {
                //FIXME: investigate why this is still required
                if (!rec.tsscript)
                    rec.tsscript = rec.script;
                this.copy(rec);
            }
            if (this.sys_id.length == 0)
                this.sys_id = 'yln';
        }
        canPlaceDebugPoints() {
            return !this.isNewRecord;
        }
        isGlobalScope() {
            return this.getScopeAndAPIMap().scope == 'global';
        }
        static convertToJSConstructor(ob) {
            if (!ob.isJavascript())
                return;
            var lines = ob.tsscript.split('\n');
            var scopeName = ob.getScopeAndAPIMap();
            var lineNo = lines.findIndex((line) => {
                if (line.indexOf('Class.create()') < 0)
                    return false;
                let lineTokens = line.split(' ');
                let newTokens = lineTokens.filter(token => token.trim().length > 0);
                if (newTokens.length != 4)
                    return false;
                newTokens = newTokens.map(token => token.trim());
                if (newTokens[0] != 'var')
                    return false;
                if (newTokens[1] != scopeName.name)
                    return false;
                if (newTokens[2] != '=')
                    return false;
                if (newTokens[3] != 'Class.create();')
                    return false;
                return true;
            });
            if (lineNo == -1)
                return;
            ClientSIRecordData.isClsFound = true;
            lines[lineNo] = `function ${scopeName.name}() { }`;
            ob.tsscript = ob.script = lines.join('\n');
        }
        static getClassConstructorFormat(ob) {
            if (ob.isTypescript())
                return ob.script;
            if (window.recordConfig.isES6)
                return ob.script;
            if (!ClientSIRecordData.isClsFound)
                return ob.tsscript;
            var scopeName = ob.getScopeAndAPIMap();
            var lines = ob.tsscript.split('\n');
            var lineIndex = lines.findIndex(line => {
                if (line.trim().startsWith(`function ${scopeName.name}() { }`))
                    return true;
                return false;
            });
            if (lineIndex == -1)
                return ob.tsscript;
            lines[lineIndex] = `var ${scopeName.name} = Class.create();`;
            return lines.join('\n');
        }
        getScopeAndAPIMap() {
            var tokens = this.api_name.split('.');
            var scopeName = tokens[0];
            var simpleName = tokens.length == 2 ? tokens[1] : '';
            return {
                scope: scopeName,
                name: simpleName
            };
        }
        isTypescriptWithJSStyle() {
            return false;
        }
        isJavascript() {
            return this.script_type.length == 0 || this.script_type == 'javascript' || this.script_type == 'js';
        }
        isTypescript() {
            return this.script_type == 'typescript' || this.script_type == 'ts';
        }
        updateScriptType(newFileName) {
            if (typeof newFileName !== 'string' || newFileName.length === 0)
                return;
            const fileTokens = newFileName.split('.');
            if (fileTokens.length !== 2)
                return;
            if (fileTokens[1] === 'ts')
                this.script_type = constants_2.LangType.typescript;
            else
                this.script_type = constants_2.LangType.javascript;
        }
        containsTemplateExpression() {
            var regExp = getDotWalkingRegExp();
            return regExp.test(this.tsscript);
            function replace(str) {
                //let repl = /(\${2}{[^\{]+(?=\})\})/;
                let copyStr = str.replace(regExp, ($0, $1, $2, $3, $4, $5) => {
                    var copy$2 = $2;
                    $2 = $2.replace(/^\$\${/, '');
                    $2 = $2.replace(/\}$/, '');
                    let tokens = $2.split('.');
                    if (tokens.length == 1)
                        return copy$2;
                    tokens.splice(0, 1);
                    return $1 + tokens.join('.') + $3;
                });
                return copyStr;
            }
        }
        generateCurrentSIDeclaration(esp, jsDoc = false) {
            if (this.isTypescript())
                return "";
            var ob = this.generateDeclaration(esp, jsDoc);
            var format = ob.getFormat(true);
            var formatSI = JSON.parse(format);
            var tokens = this.api_name.split('.');
            var currentScopeName = tokens[0];
            var apiSimpleName = tokens[1];
            var content = '"' + apiSimpleName + '":' + this.api_name + 'Constructor';
            var interFormat = wrapInInterface(content, "JSTypes");
            var defFormat = wrapInNamespace(formatSI[currentScopeName][0].typeFormat + '\n' + formatSI[currentScopeName][0].aliasFormat, currentScopeName);
            return defFormat + '\n' + interFormat;
        }
        formatCurrentSITSFormat(val) {
            let tokens = this.api_name.split('.');
            var defFormat = wrapInNamespace(val.tf + '\n\n' + val.af, tokens[0]);
            return defFormat;
        }
        generateDeclaration(esp, parseJSDoc = false) {
            if (!this.canGenerateDeclaration())
                new Error("declaration is not possible");
            return parseSI([this], esp, {}, parseJSDoc);
        }
        updateTSScript(tsScript) {
            this.tsscript = tsScript;
        }
        updateScript(script) {
            this.script = script;
        }
        updateDeclaration(decl) {
            this.typedeclaration = decl;
        }
        updateJSDoc(val) {
            this.jsdoc = val;
        }
        updateSourcemap(sourceMap) {
            this.typesourcemap = sourceMap;
        }
        isUpToDate() {
            return !this._isDirty;
        }
        setDirtyState(newState) {
            this._isDirty = newState;
        }
        isDirty() {
            return this._isDirty;
        }
        canGenerateDeclaration() {
            if (this.isNew()) {
                console.log("generating declaration without apiname not possible");
                return false;
            }
            if (this.isTypescript()) {
                console.log("generating typescript is automatic");
                return false;
            }
            if (this.script.length == 0) {
                console.log('declaration not possible for empty script');
                return false;
            }
            if (this.api_name.length == 0)
                return false;
            var tokens = this.api_name.split('.');
            if (tokens.length != 2)
                return false;
            return true;
        }
        isNew() {
            if (typeof window != 'undefined')
                return window.recordConfig.isNewRecord;
            if (this.api_name == 'global')
                return true;
            return this.api_name.length != 0 && this.sys_id.length == 0;
        }
        formatForAddLib(obj, scopeName) {
            scopeName = scopeName || obj.api.split('.')[0];
            var ob = {};
            ob[scopeName] = [obj];
            var def = new DefinitionEmittor(ob);
            return def.emit(scopeName);
        }
        updateAPIName(newAPIName) {
            if (newAPIName.length == 0)
                return console.log("API name should not be empty");
            let apiTokens = newAPIName.split('.');
            if (apiTokens.length > 2)
                newAPIName = apiTokens.slice(0, 2).join('.');
            this.api_name = newAPIName;
        }
        updateSysId(newSysId) {
            this.sys_id = newSysId;
        }
        updateAccessType(newAccess) {
            this.access = newAccess;
        }
        updateLangType(newLang) {
            if (!!newLang)
                this.script_type = newLang;
            else
                this.script_type = 'javascript';
        }
        emitTSDeclaration(decl = '', typeFlags = 0) {
            const clsReg = /declare class/gi;
            const funReg = /declare function/gi;
            const enumReg = /declare enum/gi;
            const varReg = /declare var/gi;
            const constVarReg = /declare const/gi;
            const typeReg = /declare type/gi;
            const namespaceReg = /declare namespace/gi;
            decl = decl.replace(clsReg, TokenType.class);
            decl = decl.replace(funReg, TokenType.function);
            decl = decl.replace(enumReg, 'enum');
            decl = decl.replace(varReg, 'var');
            decl = decl.replace(constVarReg, 'const');
            decl = decl.replace(typeReg, 'type');
            decl = decl.replace(namespaceReg, 'namespace');
            decl = decl.replace('/// <reference types="snlib" />', '');
            var nsNumber = ''; //Math.round(Math.random() * 100000);
            var tempNamespace = '';
            var scopeAndAPI = this.getScopeAndAPIMap();
            var currentScope = scopeAndAPI.scope;
            var simpleName = scopeAndAPI.name || 'Point';
            if (this.isNew())
                tempNamespace = this.api_name + '_' + simpleName + nsNumber;
            else
                tempNamespace = this.api_name.replace('.', '_') + nsNumber;
            //https://github.com/Microsoft/TypeScript/issues/5017
            /*
                declare namespace global {
                    namespace global_Point {
                        class Point {
                            constructor();
                            initialize(): boolean;
                        }
                    }
                    export import Point = global.global_Point12345.Point;
                }
                import Point = global.global_Point.Point;
            */
            let anonymousDecl = TokenType.export + TokenType.space + TokenType.import + TokenType.space + simpleName + TokenType.space + TokenType.equal;
            anonymousDecl += TokenType.space + currentScope + TokenType.dot + tempNamespace + TokenType.dot + simpleName + TokenType.semicolon;
            let globalAnonymousDecl = TokenType.import + TokenType.space + simpleName + TokenType.space + TokenType.equal;
            globalAnonymousDecl += TokenType.space + currentScope + TokenType.dot + tempNamespace + TokenType.dot + simpleName + TokenType.semicolon;
            // FIXME: All types are coming as "simpleNames" not as "scopeName.simpleNames" in other script includes
            globalAnonymousDecl = '';
            var builder = TokenType.namespace + TokenType.space + tempNamespace + TokenType.space +
                TokenType.blockOpen + TokenType.newline;
            builder += decl + TokenType.newline + TokenType.blockClose + TokenType.newline;
            var siFormat = new SITSFormat(simpleName, this.sys_id, builder, anonymousDecl, globalAnonymousDecl, this.access, JSExportedTypes.cls, 0);
            var backEndDecl = {
                api: simpleName,
                id: this.sys_id,
                f: typeFlags,
                tf: builder
            };
            SITSFormat.updateFlags(backEndDecl, this, JSExportedTypes.cls);
            return backEndDecl;
        }
        static fromSIRec(siRec) {
            var csi = new ClientSIRecordData(undefined, false);
            for (let prop in siRec) {
                csi[prop] = siRec[prop].value;
            }
            csi.active = siRec.active.value == '1';
            csi.jsdoc = true;
            //csi.script_type = siRec.script_type.value == 'js'?: 'javascript': 'typescript';
            var csiClone = new ClientSIRecordData(undefined, window.recordConfig.isNewRecord);
            csiClone.copy(csi);
            return csiClone;
        }
        copy(rec) {
            this.parseReturnType = rec.parseReturnType;
            this.access = rec.access;
            this.active = rec.active + '' == 'true';
            this.api_name = rec.api_name;
            this.jsdoc = rec.jsdoc + '' == 'true';
            this.client_callable = rec.client_callable + '' == 'true';
            this.description = rec.description;
            this.name = rec.name;
            this.script = rec.script;
            this.script_type = !!rec.script_type ? rec.script_type : 'javascript';
            this.sys_class_name = rec.sys_class_name;
            this.sys_updated_by = rec.sys_updated_by;
            this.sys_created_on = rec.sys_created_on;
            this.sys_id = rec.sys_id;
            this.sys_mod_count = parseInt(rec.sys_mod_count + '');
            this.sys_name = rec.sys_name;
            this.sys_package = rec.sys_package;
            this.sys_policy = rec.sys_policy;
            this.sys_scope = rec.sys_scope;
            this.sys_tags = rec.sys_tags;
            this.sys_update_name = rec.sys_update_name;
            this.sys_created_by = rec.sys_created_by;
            this.sys_updated_on = rec.sys_updated_by;
            this.sys_updated_on = rec.sys_updated_on;
            this.typedeclaration = !!rec.typedeclaration ? rec.typedeclaration : '';
            this.typesourcemap = !!rec.typesourcemap ? rec.typesourcemap : '';
            this.tsscript = rec.tsscript;
        }
    }
    exports.ClientSIRecordData = ClientSIRecordData;
    ClientSIRecordData.isClsFound = false;
    var SIFlags;
    (function (SIFlags) {
        SIFlags[SIFlags["public"] = 2] = "public";
        SIFlags[SIFlags["cls"] = 4] = "cls";
        SIFlags[SIFlags["fun"] = 8] = "fun";
        SIFlags[SIFlags["obj"] = 16] = "obj";
        SIFlags[SIFlags["blocked"] = 32] = "blocked";
        SIFlags[SIFlags["ts"] = 64] = "ts";
        SIFlags[SIFlags["jsES6"] = 128] = "jsES6";
    })(SIFlags || (SIFlags = {}));
    class SITSFormat {
        //WARN: never make instance methods. so many hacks for this format.
        //FIXME: remove accessType and internalType
        constructor(api, id, tf, af /**anonymous format */, gf /**global format */, accessType, internalType, f, td, sp) {
            this.api = api;
            this.id = id;
            this.tf = tf;
            this.af = af;
            this.gf = gf;
            this.accessType = accessType;
            this.internalType = internalType;
            this.f = f;
            this.td = td;
            this.sp = sp;
        }
        static expandMinifiedFormat(siFormat, scopeName, isTS = false) {
            if (siFormat instanceof SITSFormat)
                return siFormat;
            if (siFormat.f == 0 && !isTS)
                return null;
            if (siFormat.f == 0)
                return null;
            function getFormatWithLineInfo(item) {
                var semiColon = item.f.endsWith(';') ? "" : ';';
                item.l = item.l || 0;
                var str = `/** [Go to Implementation](http://${scopeName}.${siFormat.api}/${item.l}) */
					${item.f}${semiColon}
					`;
                return str;
            }
            isTS = SITSFormat.isTypescript(siFormat.f) || SITSFormat.isES6(siFormat.f);
            if (siFormat.df && !isTS) {
                if (SITSFormat.isObject(siFormat.f)) {
                    let str = '';
                    siFormat.df.forEach((item, index, sourceArray) => {
                        if (Array.isArray(item)) {
                            console.warn("invalid syntax found");
                            return;
                        }
                        str += getFormatWithLineInfo(item);
                    });
                    siFormat.tf = str;
                }
                else if (SITSFormat.isClass(siFormat.f) || this.isFunction(siFormat.f)) {
                    if (Array.isArray(siFormat.df) && siFormat.df.length == 2) {
                        let memberDF = siFormat.df[0];
                        let staticDF = siFormat.df[1];
                        let memberTF = '';
                        let staticTF = '';
                        memberDF.forEach(item => {
                            memberTF += getFormatWithLineInfo(item);
                        });
                        staticDF.forEach(item => {
                            staticTF += getFormatWithLineInfo(item);
                        });
                        siFormat.tf = [memberTF, staticTF];
                    }
                }
            }
            let af = `/** [Go to Implementation](http://${scopeName}.${siFormat.api}/1) */
		const ${siFormat.api}: ${siFormat.api}Constructor`;
            let gf = `/** [Go to Implementation](http://${scopeName}.${siFormat.api}/1) */
		declare const ${siFormat.api}: ${scopeName}.${siFormat.api}Constructor`;
            if (isTS) {
                af = `/** [Go to Implementation](http://${scopeName}.${siFormat.api}/1) */
			export import ${siFormat.api} = ${scopeName}.${scopeName}_${siFormat.api}.${siFormat.api}`;
                gf = '';
                siFormat.f |= SIFlags.cls;
                siFormat.af = af;
                siFormat.gf = gf;
                if (Array.isArray(siFormat.tf))
                    siFormat.tf = siFormat.tf[0];
                else if (typeof siFormat.tf != 'string')
                    siFormat.tf = '';
                return siFormat;
            }
            if (SITSFormat.isObject(siFormat.f)) {
                if (siFormat.df) {
                    siFormat.tf = `{
					${siFormat.tf}
				}`;
                }
                siFormat.tf = `interface ${siFormat.api} ${siFormat.tf}`;
                siFormat.af = `const ${siFormat.api}: ${siFormat.api}`;
                siFormat.gf = `declare const ${siFormat.api}: ${scopeName}.${siFormat.api}`;
                return siFormat;
            }
            if (SITSFormat.isClass(siFormat.f) || SITSFormat.isFunction(siFormat.f)) {
                if (!Array.isArray(siFormat.tf))
                    return null;
                if (SITSFormat.isClass(siFormat.f) && siFormat.tf.length != 2)
                    return null;
                if (SITSFormat.isClass(siFormat.f) && !siFormat.sp || SITSFormat.isFunction(siFormat.f)) {
                    if (SITSFormat.isFunction(siFormat.f)) {
                        siFormat.tf = `interface ${siFormat.api}Constructor {
						${siFormat.tf[1]}
					}`;
                    }
                    else {
                        siFormat.tf = `interface ${siFormat.api} {
						${siFormat.tf[0]}
					}
					interface ${siFormat.api}Constructor {
						${siFormat.tf[1]}
					}`;
                    }
                }
                if (SITSFormat.isClass(siFormat.f) && typeof siFormat.sp == 'string') {
                    let superName = siFormat.sp;
                    let tokens = siFormat.sp.split('.');
                    if (tokens.length == 1)
                        superName = `${scopeName}.${siFormat.api}`;
                    siFormat.tf = `interface ${siFormat.api} extends ${superName} {
					${siFormat.tf[0]}
				}
				interface ${siFormat.api}Constructor {
					${siFormat.tf[1]}
				}`;
                }
                siFormat.af = af;
                siFormat.gf = gf;
                return siFormat;
            }
            siFormat.af = af;
            siFormat.gf = gf;
            siFormat.tf = '';
            return siFormat;
        }
        static expandMinifiedFormat_1(siFormat, scopeName, isTS = false) {
            if (siFormat instanceof SITSFormat)
                return siFormat;
            if (siFormat.f == 0 && !isTS)
                return null;
            if (siFormat.f == 0)
                return null;
            isTS = SITSFormat.isTypescript(siFormat.f);
            let af = `const ${siFormat.api}: ${siFormat.api}Constructor`;
            let gf = `declare const ${siFormat.api}: ${scopeName}.${siFormat.api}Constructor`;
            if (isTS) {
                af = `export import ${siFormat.api} = ${scopeName}.${scopeName}_${siFormat.api}.${siFormat.api}`;
                gf = '';
                siFormat.f |= SIFlags.cls;
                siFormat.af = af;
                siFormat.gf = gf;
                if (Array.isArray(siFormat.tf))
                    siFormat.tf = siFormat.tf[0];
                else if (typeof siFormat.tf != 'string')
                    siFormat.tf = '';
                return siFormat;
            }
            if (SITSFormat.isObject(siFormat.f)) {
                siFormat.tf = `interface ${siFormat.api} ${siFormat.tf}`;
                siFormat.af = `const ${siFormat.api}: ${siFormat.api}`;
                siFormat.gf = `declare const ${siFormat.api}: ${scopeName}.${siFormat.api}`;
                return siFormat;
            }
            if (SITSFormat.isClass(siFormat.f) || SITSFormat.isFunction(siFormat.f)) {
                if (!Array.isArray(siFormat.tf))
                    return null;
                if (SITSFormat.isClass(siFormat.f) && siFormat.tf.length != 2)
                    return null;
                if (SITSFormat.isClass(siFormat.f) && !siFormat.sp || SITSFormat.isFunction(siFormat.f)) {
                    if (SITSFormat.isFunction(siFormat.f)) {
                        siFormat.tf = `interface ${siFormat.api}Constructor {
						${siFormat.tf[1]}
					}`;
                    }
                    else {
                        siFormat.tf = `interface ${siFormat.api} {
						${siFormat.tf[0]}
					}
					interface ${siFormat.api}Constructor {
						${siFormat.tf[1]}
					}`;
                    }
                }
                if (SITSFormat.isClass(siFormat.f) && typeof siFormat.sp == 'string') {
                    let superName = siFormat.sp;
                    let tokens = siFormat.sp.split('.');
                    if (tokens.length == 1)
                        superName = `${scopeName}.${siFormat.api}`;
                    siFormat.tf = `interface ${siFormat.api} extends ${superName} {
					${siFormat.tf[0]}
				}
				interface ${siFormat.api}Constructor {
					${siFormat.tf[1]}
				}`;
                }
                siFormat.af = af;
                siFormat.gf = gf;
                return siFormat;
            }
            siFormat.af = af;
            siFormat.gf = gf;
            siFormat.tf = '';
            return siFormat;
        }
        static updateFlags(siFormat, siRecord, internalType) {
            let flags = siFormat.f || 0;
            if (siRecord.access == SIAccessType.public)
                flags |= SIFlags.public;
            if (siRecord.isTypescript())
                flags |= SIFlags.ts;
            if (SITSFormat.isES6(flags)) {
                flags |= SIFlags.ts;
                flags |= SIFlags.jsES6;
            }
            if (internalType == JSExportedTypes.cls)
                flags |= SIFlags.cls;
            else if (internalType == JSExportedTypes.var)
                flags |= SIFlags.obj;
            else if (internalType == JSExportedTypes.fun)
                flags |= SIFlags.fun;
            siFormat.f = flags;
        }
        static updateFlagsMinifiy(siFormat, siRecord, internalType) {
            let flags = siFormat.f || 0;
            if (siRecord.access == SIAccessType.public)
                flags |= SIFlags.public;
            if (siRecord.isTypescript())
                flags |= SIFlags.ts;
            if (internalType == JSExportedTypes.cls)
                flags |= SIFlags.cls;
            else if (internalType == JSExportedTypes.var)
                flags |= SIFlags.obj;
            else if (internalType == JSExportedTypes.fun)
                flags |= SIFlags.fun;
            siFormat.f = flags;
        }
        static isTypescript(flags) {
            return ((flags & SIFlags.ts) == SIFlags.ts);
        }
        static isES6(flags = 0) {
            return ((flags & SIFlags.jsES6) === SIFlags.jsES6);
        }
        static isPublic(flags) {
            return (flags & SIFlags.public) == SIFlags.public;
        }
        static isClass(flags) {
            return (flags & SIFlags.cls) == SIFlags.cls;
        }
        static isFunction(flags) {
            return (flags & SIFlags.fun) == SIFlags.fun;
        }
        static isObject(flags) {
            return (flags & SIFlags.obj) == SIFlags.obj;
        }
        static isBlocked(flags) {
            return (flags & SIFlags.blocked) == SIFlags.blocked;
        }
    }
    exports.SITSFormat = SITSFormat;
    class TypeData {
        constructor(currentSI, apiName, accessType = '', sysId = '') {
            this.currentSI = currentSI;
            this.apiName = apiName;
            this.accessType = accessType;
            this.sysId = sysId;
            this.apiName = apiName.trim();
            this.accessType = '';
            this.sysId = '';
        }
        getJSName() {
            if (!this.apiName)
                return {};
            var tokens = this.apiName.split('.');
            var name = '';
            var scopeName = '';
            if (tokens.length == 1)
                name = tokens[0];
            else if (tokens.length == 2) {
                scopeName = tokens[0];
                name = tokens[1];
            }
            return {
                name: name,
                scopeName: scopeName
            };
        }
        getInternalType() {
            return JSExportedTypes.never;
        }
        setAccessType(accessType) {
            this.accessType = accessType;
        }
        setSysId(sysId) {
            this.sysId = sysId;
        }
        exportAliasName(isInNamespace) {
            var str = TokenType.const + TokenType.space + this.getJSName().name +
                TokenType.space + TokenType.colon + TokenType.space + this.apiName + TokenType.typeAdd + TokenType.semicolon;
            if (isInNamespace)
                return str;
            return TokenType.declare + TokenType.space + str;
        }
    }
    exports.TypeData = TypeData;
    class TypeVarData extends TypeData {
        constructor(currentSI, apiName, format) {
            super(currentSI, apiName);
            this.apiName = apiName;
            this.format = format;
            this.format = format;
        }
        getTempInterfaceName() {
            return this.apiName;
        }
        toInternalFormat() {
            var jsName = this.getJSName().name;
            var typeName = this.getTempInterfaceName();
            var tokens = typeName.split(".");
            typeName = tokens[tokens.length - 1];
            var tempType = TokenType.interface + TokenType.space + typeName + this.format;
            //return tempType + TokenType.newline + TokenType.const + TokenType.space + jsName +  TokenType.colon + typeName + TokenType.semicolon;
            return tempType;
        }
        exportToTS() {
            //return this.toInternalFormat(true);
            var siFormat = new SITSFormat(this.apiName, this.sysId, this.toInternalFormat(), this.exportAliasName(true), this.exportAliasName(false), this.accessType, this.getInternalType(), 0);
            SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
            return siFormat;
        }
        getInternalType() {
            return JSExportedTypes.var;
        }
        exportAliasName(isInNamespace) {
            var jsInfo = this.getJSName();
            var aliasName = TokenType.const + TokenType.space;
            aliasName += jsInfo.name + TokenType.colon + this.getTempInterfaceName() + TokenType.semicolon;
            if (isInNamespace)
                return aliasName;
            return TokenType.declare + TokenType.space + aliasName;
        }
    }
    exports.TypeVarData = TypeVarData;
    class TypeFunctionData extends TypeData {
        constructor(currentSI, apiName, format, isStatic = false) {
            super(currentSI, apiName);
            this.apiName = apiName;
            this.format = format;
            this.format = format;
        }
        getTypeFormat() {
            var jsName = this.getJSName();
            return TokenType.function + TokenType.space + jsName.name + this.format + TokenType.semicolon;
        }
        exportToTS() {
            let jsName = this.getJSName();
            let str = this.getTypeFormat();
            let flags = 0;
            let siFormat = new SITSFormat(this.apiName, this.sysId, "", // format is not required becuase alias name serves the purpose. otherwise it export 2 times.
            this.exportAliasName(true), this.exportAliasName(false), this.accessType, this.getInternalType(), flags);
            SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
            return siFormat;
        }
        getInternalType() {
            return JSExportedTypes.fun;
        }
        exportAliasName(isInNamespace) {
            if (isInNamespace)
                return this.getTypeFormat();
            return TokenType.declare + TokenType.space + this.getTypeFormat();
        }
    }
    exports.TypeFunctionData = TypeFunctionData;
    class TypeClassData extends TypeData {
        constructor(currentSI, apiName, baseName = '', constructorFormat = '') {
            super(currentSI, apiName);
            this.apiName = apiName;
            this.baseName = baseName;
            this.constructorFormat = constructorFormat;
            this.fields = [];
            this.baseName = '';
        }
        setBaseName(baseName) {
            this.baseName = baseName;
        }
        setConstructor(constFormat) {
            this.constructorFormat = constFormat;
        }
        addField(key, value, isStatic, isMemberFunction) {
            let isExists = false;
            this.fields.every((item) => {
                if (item.key == key && item.isStatic == isStatic) {
                    isExists = true;
                    return false;
                }
                return true;
            });
            if (isExists)
                return;
            this.fields.push({
                key: key, value: value, isStatic: isStatic, isMemberFunction: isMemberFunction
            });
        }
        getFieldFormat() {
            var memberFormat = '';
            var staticFormat = '';
            for (var i = 0; i < this.fields.length; i++) {
                let field = this.fields[i];
                let thisFieldFormat = field.key;
                if (!field.isMemberFunction)
                    thisFieldFormat += TokenType.colon + TokenType.space;
                thisFieldFormat += field.value + TokenType.semicolon;
                thisFieldFormat += TokenType.newline;
                if (field.isStatic)
                    staticFormat += thisFieldFormat;
                else
                    memberFormat += thisFieldFormat;
            }
            return {
                staticFields: staticFormat,
                memberFields: memberFormat
            };
        }
        getStaticTypeFormat() {
            var info = this.getJSName();
            var staticTypeFormat = TokenType.interface + TokenType.space +
                info.name + TokenType.typeAdd + TokenType.space + TokenType.blockOpen + TokenType.newline;
            var staticFields = this.getFieldFormat().staticFields;
            if (!this.constructorFormat)
                this.constructorFormat = TokenType.functionOpen + TokenType.functionClose;
            staticTypeFormat += TokenType.new + this.constructorFormat + TokenType.colon + this.getJSName().name + TokenType.semicolon;
            staticTypeFormat += TokenType.newline + TokenType.prototype_1 + TokenType.colon + TokenType.space + info.name + TokenType.semicolon;
            staticTypeFormat += TokenType.newline + staticFields;
            staticTypeFormat += TokenType.newline + TokenType.blockClose;
            return staticTypeFormat;
        }
        getMemberTypeFormat() {
            var builder = TokenType.interface + TokenType.space;
            var info = this.getJSName();
            builder += info.name;
            if (this.baseName)
                builder += TokenType.space + TokenType.extends + TokenType.space + this.baseName;
            builder += TokenType.space + TokenType.blockOpen + TokenType.newline;
            var memberFormat = this.getFieldFormat().memberFields;
            builder += memberFormat;
            builder = builder.trim();
            builder += TokenType.newline + TokenType.blockClose;
            builder += TokenType.newline;
            return builder;
        }
        exportToTS() {
            var typeFormat = this.getMemberTypeFormat() + TokenType.newline + this.getStaticTypeFormat();
            let flags = 0;
            let siFormat = new SITSFormat(this.apiName, this.sysId, typeFormat, this.exportAliasName(true), this.exportAliasName(false), this.accessType, this.getInternalType(), flags);
            SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
            return siFormat;
        }
        getInternalType() {
            return JSExportedTypes.cls;
        }
        exportAliasName(isInNamespace) {
            if (this.apiName == "global.JSON")
                return "";
            var str = TokenType.const + TokenType.space + this.getJSName().name +
                TokenType.space + TokenType.colon + TokenType.space + this.apiName + TokenType.typeAdd + TokenType.semicolon;
            if (isInNamespace)
                return str;
            return TokenType.declare + TokenType.space + str;
        }
    }
    exports.TypeClassData = TypeClassData;
    class TSClassDefinitionFormat {
        constructor(apiName, scope, declaration, accessType, sysId, aliasFormat = '') {
            this.apiName = apiName;
            this.scope = scope;
            this.declaration = declaration;
            this.accessType = accessType;
            this.sysId = sysId;
            this.aliasFormat = aliasFormat;
        }
    }
    exports.TSClassDefinitionFormat = TSClassDefinitionFormat;
    function wrapInNamespace(content, ns) {
        var str = TokenType.declare +
            TokenType.space +
            TokenType.namespace +
            TokenType.space +
            ns +
            TokenType.blockOpen +
            TokenType.newline;
        str += content + TokenType.newline + TokenType.blockClose;
        return str;
    }
    exports.wrapInNamespace = wrapInNamespace;
    function wrapInInterface(content, name) {
        var str = TokenType.interface +
            TokenType.space +
            name +
            TokenType.blockOpen +
            TokenType.newline;
        str += content;
        str += TokenType.newline + TokenType.blockClose;
        return str;
    }
    exports.wrapInInterface = wrapInInterface;
    // mostly this is to generate declaration file for working in VS Code.
    // comment the respective namespace and we get the intellisense.
    function addHeading(scopeName) {
        var str = `// ************** ` + scopeName + `   ***************`;
        return str;
    }
    function wrapInComments(content) {
        return `/*` + TokenType.newline + content + TokenType.newline + `*/`;
    }
    var existingDeclarations = {
        "global.XMLDocument": true,
        "global.JSON": true
    };
    class DefinitionEmittor {
        constructor(siJSData = {}, emitForVSCode = false) {
            this.siJSData = siJSData;
            this.emitForVSCode = emitForVSCode;
        }
        emit(currentScopeName, excludedTypes = {}) {
            let defFormat = '';
            let globalDeclarations = '';
            let dependentSuperCls = {};
            for (let scopeName in this.siJSData) {
                for (let item of this.siJSData[scopeName]) {
                    if (!item.sp)
                        continue;
                    var tokens = item.sp.split('.');
                    if (tokens.length == 1) {
                        dependentSuperCls[scopeName] = dependentSuperCls[scopeName] || {};
                        dependentSuperCls[scopeName][item.sp] = true;
                        continue;
                    }
                    dependentSuperCls[tokens[0]] = dependentSuperCls[tokens[0]] || {};
                    dependentSuperCls[tokens[0]][tokens[1]] = true;
                }
            }
            for (let scopeName in this.siJSData) {
                let thisScopeDefinitions = '';
                let isSameScope = currentScopeName == scopeName || this.emitForVSCode;
                let thisTypeDeclarations = '';
                let thisGlobalDeclarations = '';
                for (let item of this.siJSData[scopeName]) {
                    if (!item.f) {
                        console.warn('skipping declaration for => ' + item.api);
                        continue;
                    }
                    if (excludedTypes[item.id])
                        continue;
                    let isPublic = this.emitForVSCode || SITSFormat.isPublic(item.f); //item.accessType == SIAccessType.public;
                    let isPrivate = !isPublic;
                    if (isSameScope || isPublic || dependentSuperCls[scopeName] && dependentSuperCls[scopeName][item.api])
                        thisScopeDefinitions += item.tf + TokenType.newline;
                    if (isPublic || isSameScope && isPrivate) {
                        if (typeof item.af == 'string' && item.af.length != 0)
                            thisTypeDeclarations += item.af + TokenType.semicolon + TokenType.newline;
                    }
                    if (isSameScope) {
                        if (!existingDeclarations[scopeName + '.' + item.api] && typeof item.gf == 'string')
                            thisGlobalDeclarations += item.gf + TokenType.semicolon + TokenType.newline;
                    }
                }
                if (thisTypeDeclarations.length > 0)
                    thisScopeDefinitions += TokenType.newline + thisTypeDeclarations.trim();
                if (thisGlobalDeclarations.length > 0)
                    globalDeclarations += thisGlobalDeclarations.trim() + TokenType.newline;
                let wrapValue = wrapInNamespace(thisScopeDefinitions, scopeName) + TokenType.newline;
                defFormat += wrapValue;
            }
            return defFormat.trim() + TokenType.newline + globalDeclarations.trim();
        }
        getSysIdMap() {
            let sysIdToJSInfo = {};
            for (var scopeName in this.siJSData) {
                let items = this.siJSData[scopeName];
                for (let i = 0; i < items.length; i++)
                    sysIdToJSInfo[items[i].id] = items[i];
            }
            return sysIdToJSInfo;
        }
    }
    exports.DefinitionEmittor = DefinitionEmittor;
    class DefinitionEmittorForVSCode extends DefinitionEmittor {
        constructor(siJSData = {}) {
            super(siJSData, true);
            this.siJSData = siJSData;
            this.interfaceFormat = {};
            this.aliasFormat = {};
            this.globalAliasFormat = {};
            this.typeMapFormat = {};
            this.allJSTypes = {};
            this.scopeTypes = {};
        }
        exportJSON() {
            return JSON.stringify(this.siJSData);
        }
        addType(item) {
            var tokens = item.api.split(".");
            var scopeName = tokens[0];
            this.siJSData[scopeName] = this.siJSData[scopeName] || [];
            this.siJSData[scopeName].push(item);
        }
        emit() {
            return super.emit("");
        }
    }
    exports.DefinitionEmittorForVSCode = DefinitionEmittorForVSCode;
    const Kind = {
        var: "var"
    };
    const PROTOTYPE = "prototype";
    function stripPrivateTypes(currentSI, jsContent, exportedTypeName) {
        var emittor = getEmittor(currentSI, jsContent, exportedTypeName, false);
        var tokens = exportedTypeName.split(".");
        exportedTypeName = tokens[tokens.length - 1];
        function isPrototypeNode(node) {
            if (node.type != ExpressionType.ExpressionStatement)
                return false;
            if (node.expression.type != ExpressionType.AssignmentExpression)
                return false;
            return node.expression.left.property && node.expression.left.property.name == PROTOTYPE;
        }
        for (var i = 0; i < jsContent.body.length; i++) {
            var node = jsContent.body[i];
            if (node.type == ExpressionType.VariableDeclaration) {
                if (node.declarations.length == 1 && node.declarations[0].id.name != exportedTypeName) {
                    jsContent.body[i] = null;
                    continue;
                }
                for (var j = 0; j < node.declarations.length; j++) {
                    if (node.declarations[j].id.name != exportedTypeName)
                        node.declarations[j] = null;
                }
            }
            else if (node.type == ExpressionType.FunctionDeclaration) {
                if (node.id.name != exportedTypeName) {
                    jsContent.body[i] = null;
                    continue;
                }
            }
            else if (isPrototypeNode(node)) {
                if (node.expression.left.object.name != exportedTypeName)
                    jsContent.body[i] = null;
            }
            else if (node.type == ExpressionType.ExpressionStatement && node.expression &&
                node.expression.type == ExpressionType.CallExpression) {
                if (node.expression.callee && node.expression.callee.object) {
                    if (node.expression.callee.object.name == "gs" && node.expression.callee.property.name == "include") {
                        jsContent.body[i] = null;
                        continue;
                    }
                }
            }
            else if (node.type == ExpressionType.ExpressionStatement) {
                if (node.expression.type == ExpressionType.AssignmentExpression) {
                    if (node.expression.left.type == ExpressionType.Identifier) {
                        if (node.expression.left.name == exportedTypeName)
                            continue;
                    }
                    if (node.expression.left.type != ExpressionType.MemberExpression) {
                        jsContent.body[i] = null;
                        continue;
                    }
                    if (node.expression.left.object && node.expression.left.object.name != exportedTypeName) {
                        jsContent.body[i] = null;
                        continue;
                    }
                }
            }
        }
    }
    exports.stripPrivateTypes = stripPrivateTypes;
    function getEmittor(currentSI, root, apiName, parseJSDoc = false) {
        var typeName = "";
        var metaInfo = new TypeClassData(currentSI, apiName);
        function getJSDocs(comments) {
            if (!parseJSDoc)
                return {
                    fieldType: TokenType.any,
                    paramTypes: {},
                    returnType: TokenType.any
                };
            comments = '/*' + comments + '*/';
            let fieldType = TokenType.any;
            let jsDocResult;
            let returnType = TokenType.any;
            var paramTypes = {};
            let lineComments = comments.split('\n');
            let trimmedLines = lineComments.map((value, index, ar) => {
                return value.trim();
            });
            jsDocResult = JSDocParser.parse(trimmedLines.join('\n'));
            if (jsDocResult.length > 0) {
                var docResult = jsDocResult[0];
                let isOption;
                for (let tagOb of docResult.tags) {
                    if (!tagOb.type)
                        continue;
                    if (tagOb.type.length == 0)
                        continue;
                    let tag = tagOb.tag;
                    if (tag == 'param')
                        paramTypes[tagOb.name] = tagOb.optional ? '?: ' + tagOb.type : ': ' + tagOb.type;
                    else if (tag == 'returns' || tag == 'return')
                        returnType = tagOb.type;
                    else if (tag == 'type' && !!tagOb.type)
                        fieldType = tagOb.type;
                }
            }
            return {
                fieldType: fieldType,
                paramTypes: paramTypes,
                returnType: returnType
            };
        }
        function parseThisExpression(body) {
            let ar = new Array();
            for (let i = 0; i < body.length; i++) {
                let item = body[i];
                if (item.type != ExpressionType.ExpressionStatement)
                    continue;
                if (!item.expression)
                    continue;
                if (item.expression.type != ExpressionType.AssignmentExpression)
                    continue;
                if (item.expression.operator != '=')
                    continue;
                if (!item.expression.left)
                    continue;
                if (item.expression.left.type != ExpressionType.MemberExpression)
                    continue;
                if (!item.expression.left.object)
                    continue;
                if (item.expression.left.object.type != ExpressionType.ThisExpression)
                    continue;
                let jsDoc = {
                    fieldType: TokenType.any,
                    paramTypes: {},
                    returnType: TokenType.any
                };
                if (parseJSDoc) {
                    if (!!item.leadingComments && item.leadingComments.length > 0) {
                        let comment = item.leadingComments[0].value;
                        jsDoc = getJSDocs(comment);
                    }
                }
                let name = '';
                let value = TokenType.any;
                if (item.expression.left.property.type == ExpressionType.Identifier) {
                    name = item.expression.left.property.name;
                    if (item.expression.right.type == ExpressionType.Literal)
                        value = typeof (item.expression.right.value);
                }
                else if (item.expression.left.property.type == ExpressionType.Literal) {
                    name = item.expression.left.property.value;
                    if (item.expression.right.type == ExpressionType.Literal)
                        value = typeof (item.expression.right.value);
                }
                if (parseJSDoc) {
                    if (jsDoc.fieldType != TokenType.any)
                        value = jsDoc.fieldType;
                }
                let ob = {
                    name: name,
                    value: value
                };
                ar.push(ob);
            }
            return ar;
        }
        var TSEmittor = {
            getMetaInfo: function () {
                return metaInfo;
            },
            getSimpleName() {
                var tokens = apiName.split('.');
                if (tokens.length == 0)
                    return "";
                return tokens[tokens.length - 1];
            },
            isSingleFunctionExported: function (node, parent, expType) {
                if (node.type == expType && parent.body.length == 1)
                    return true;
                return this.isAnonymousTypeExported(node, parent, ExpressionType.FunctionExpression);
            },
            isAnonymousTypeExported: function (node, parent, typeName) {
                var tokens = apiName.split('.');
                var simpleName = tokens[tokens.length - 1];
                if (node.type == ExpressionType.VariableDeclaration || node.type == ExpressionType.ExpressionStatement) {
                    if (node.type == ExpressionType.ExpressionStatement && node.expression.type == ExpressionType.AssignmentExpression) {
                        if (node.expression.left.type == ExpressionType.Identifier && node.expression.left.name == simpleName) {
                            if (node.expression.right.type == typeName)
                                return true;
                        }
                    }
                }
                return false;
            },
            anonymousDeclaration: function (node, parent, name) {
                var tokens = name.split(".");
                var simpleName = tokens[tokens.length - 1];
                var builder = "";
                if (node.type == ExpressionType.VariableDeclaration || node.type == ExpressionType.ExpressionStatement) {
                    if (node.type == ExpressionType.ExpressionStatement && node.expression.type == ExpressionType.AssignmentExpression) {
                        if (node.expression.left.type == ExpressionType.Identifier && node.expression.left.name == simpleName) {
                            if (this.isAnonymousTypeExported(node, parent, ExpressionType.CallExpression)) {
                                // anonymous declaration
                                // e.g myType = Class.create();
                                typeName = simpleName;
                                var baseClsInfo = this.getBaseClassInfo();
                                builder = TokenType.class + TokenType.space + simpleName;
                                if (baseClsInfo.name) {
                                    builder += TokenType.space + TokenType.extends + TokenType.space + baseClsInfo.name;
                                    metaInfo.setBaseName(baseClsInfo.name);
                                }
                                builder += TokenType.blockOpen + TokenType.newline;
                                return builder;
                            }
                            else if (this.isAnonymousTypeExported(node, parent, ExpressionType.ObjectExpression)) {
                                /* anonymous object declaration
                                    name = {
                                        getKey: function() {
    
                                        }
                                    }
                                */
                            }
                            else if (this.isAnonymousTypeExported(node, parent, ExpressionType.FunctionExpression)) {
                                console.log('anonymous function expression');
                                var str = TokenType.function + TokenType.space + this.getSimpleName();
                                let params = node.expression.right.params;
                                var paramFormat = TokenType.functionOpen;
                                for (let i = 0; i < params.length; i++) {
                                    paramFormat += params[i].name + TokenType.colon + TokenType.any;
                                    if (i != params.length)
                                        paramFormat += TokenType.comma;
                                }
                                paramFormat += TokenType.functionClose;
                                metaInfo = new TypeFunctionData(currentSI, apiName, paramFormat);
                                return TokenType.function + TokenType.space + this.getSimpleName() + paramFormat + TokenType.semicolon;
                            }
                        }
                    }
                }
                else if (this.isSingleFunctionExported(node, parent, ExpressionType.FunctionDeclaration)) {
                    let jsDocResult = {
                        fieldType: TokenType.any,
                        paramType: {},
                        returnType: TokenType.any
                    };
                    if (node.leadingComments && node.leadingComments.length == 1) {
                        let comments = node.leadingComments[0].value;
                        jsDocResult = getJSDocs(comments);
                        jsDocResult.paramTypes;
                    }
                    var str = TokenType.function + TokenType.space + node.id.name;
                    var paramFormat = TokenType.functionOpen;
                    for (var i = 0; i < node.params.length; i++) {
                        paramFormat += node.params[i].name;
                        if (jsDocResult.paramTypes && jsDocResult.paramTypes[node.params[i].name])
                            paramFormat += jsDocResult.paramTypes[node.params[i].name];
                        if (i != node.params.length - 1)
                            paramFormat += TokenType.comma;
                    }
                    paramFormat += TokenType.functionClose;
                    if (!!jsDocResult.returnType && jsDocResult.returnType != TokenType.any)
                        paramFormat += TokenType.colon + TokenType.space + jsDocResult.returnType;
                    metaInfo = new TypeFunctionData(currentSI, apiName, paramFormat);
                    str += paramFormat;
                    str += TokenType.semicolon;
                    return str;
                }
                return '';
            },
            isPrototype: function (node, parent) {
                if (node.type != ExpressionType.ExpressionStatement)
                    return false;
                if (node.expression.type != ExpressionType.AssignmentExpression)
                    return false;
                if (!node.expression.left.object)
                    return false;
                if (!node.expression.left.object || node.expression.left.object.name != typeName)
                    return false;
                if (!node.expression.left.property || node.expression.left.property.name != PROTOTYPE)
                    return false;
                return true;
            },
            FunctionDeclaration: function (node, root) {
                var baseClsInfo = this.getBaseClassInfo();
                if (!baseClsInfo.name) {
                    typeName = node.id.name;
                    return (TokenType.class +
                        TokenType.space +
                        node.id.name +
                        TokenType.space +
                        TokenType.blockOpen);
                }
            },
            VarialbeDeclarator: function (node, parent) {
                typeName = node.id.name;
                return TokenType.class + TokenType.space + node.id.name;
            },
            getBaseClassInfo: function () {
                for (var i = 0; i < root.body.length; i++) {
                    var node = root.body[i];
                    if (!node)
                        continue;
                    if (this.isPrototype(node, null)) {
                        if (node.expression.right.type == ExpressionType.ObjectExpression)
                            return { name: undefined, properties: node.expression.right.properties };
                        if (node.expression.right.type == ExpressionType.CallExpression) {
                            var arg = node.expression.right.arguments[0];
                            var name = "";
                            if (arg.type == ExpressionType.Identifier)
                                name = arg.name;
                            else if (arg.type == ExpressionType.MemberExpression)
                                name = arg.object.name + "." + arg.property.name;
                            if (!!name) {
                                let args = node.expression.right.arguments;
                                let propertis = [];
                                if (args.length >= 2 && args[1].properties)
                                    propertis = args[1].properties;
                                let tokens = name.split('.');
                                if (tokens.length > 1 && tokens[1] == TokenType.prototype_1)
                                    name = tokens[0];
                                return {
                                    name: name,
                                    properties: propertis
                                };
                            }
                        }
                        break;
                    }
                }
                return {};
            },
            isObjectDeclaration: function (node) {
                if (!node)
                    return false;
                //if (node.kind != Kind.var || node.type == ExpressionType.ExpressionType) {
                if (node.kind != Kind.var) {
                    if (node.type == ExpressionType.ExpressionStatement)
                        return (node.expression.right &&
                            node.expression.right.type &&
                            node.expression.right.type ==
                                ExpressionType.ObjectExpression);
                    return false;
                }
                for (var i = 0; i < node.declarations.length; i++) {
                    var decl = node.declarations[0];
                    return decl.init.type == ExpressionType.ObjectExpression;
                }
            },
            VariableDeclaration: function (node, parent) {
                var isVarType = node.kind == Kind.var;
                var isObjDecl = this.isObjectDeclaration(node);
                if (node.kind != Kind.var && !isObjDecl) {
                    console.log("not defined");
                    return;
                }
                if (!isVarType && isObjDecl) {
                    var result = this.formatObjectExpression(node.expression.right.properties, true, false);
                    result = TokenType.var + TokenType.space + node.expression.left.name + TokenType.colon + TokenType.space + result;
                    return result;
                }
                for (var i = 0; i < node.declarations.length; i++) {
                    var decl = node.declarations[0];
                    if (decl.init.type == ExpressionType.ObjectExpression) {
                        var result = this.formatObjectExpression(decl.init.properties, true, false);
                        metaInfo = new TypeVarData(currentSI, apiName, result);
                        result = TokenType.var + TokenType.space + decl.id.name + TokenType.colon + TokenType.space + result;
                        return result;
                    }
                    var r = this.VarialbeDeclarator(node.declarations[i], node);
                    r += TokenType.space;
                    var baseCls = this.getBaseClassInfo();
                    if (baseCls.name) {
                        r += TokenType.extends + TokenType.space + baseCls.name + TokenType.space;
                        metaInfo.setBaseName(baseCls.name);
                    }
                    r += TokenType.blockOpen;
                    return r;
                }
            },
            ExpressionStatement: function (node, parent) {
                var childNode = node.expression;
                if (childNode.type == ExpressionType.AssignmentExpression) {
                    var isAnonymousObjDecl = this.isAnonymousTypeExported(node, parent, ExpressionType.ObjectExpression);
                    var isAnonymousFunDecl = this.isAnonymousTypeExported(node, parent, ExpressionType.FunctionExpression);
                    if (isAnonymousObjDecl) {
                        var type = this.formatObjectExpression(childNode.right.properties, false, false);
                        var varFormat = TokenType.blockOpen + TokenType.newline;
                        varFormat += type + TokenType.blockClose;
                        metaInfo = new TypeVarData(currentSI, apiName, varFormat);
                        return "";
                    }
                    else if (isAnonymousFunDecl) {
                    }
                    return this.MemberExpression(childNode, node);
                }
            },
            AssignmentExpression: function (node, parent) {
                console.log("assignment expression");
            },
            FunctionExpression: function (node, parent) {
                if (!(node.left.property || node.left.name))
                    return "";
                let jsDocResult = {};
                if (parent && parent.leadingComments && parent.leadingComments.length > 0)
                    jsDocResult = getJSDocs(parent.leadingComments[0].value);
                var str = '';
                if (node.left.property)
                    str = node.left.property.name;
                else
                    str = node.left.name;
                str += TokenType.functionOpen;
                for (var i = 0; i < node.right.params.length; i++) {
                    let name = node.right.params[i].name;
                    let filedType = TokenType.any;
                    if (jsDocResult.paramTypes && jsDocResult.paramTypes[name]) {
                        filedType = jsDocResult.paramTypes[name];
                        str += node.right.params[i].name + filedType;
                    }
                    else
                        str += node.right.params[i].name + TokenType.colon + filedType;
                    if (i != node.right.params.length - 1)
                        str += TokenType.comma;
                }
                str += TokenType.functionClose;
                if (jsDocResult.returnType && jsDocResult.returnType != TokenType.any)
                    str += TokenType.colon + jsDocResult.returnType;
                str += TokenType.semicolon;
                return str;
            },
            MemberExpression: function (node, parent) {
                var isStatic = node.left.object && node.left.object.name === typeName;
                var name = node.left.property && node.left.property.name;
                let jsDocResult = {};
                if (parent && parent.leadingComments && parent.leadingComments.length > 0)
                    jsDocResult = getJSDocs(parent.leadingComments[0].value);
                var str = "";
                if (isStatic)
                    str = TokenType.static + TokenType.space;
                var isFun = node.right.type == ExpressionType.FunctionExpression;
                if (isFun) {
                    str += this.FunctionExpression(node, parent);
                    //return str;
                }
                else
                    str += name + TokenType.colon;
                var type = TokenType.any;
                if (node.right.type == ExpressionType.Literal) {
                    var sType = typeof node.right.value;
                    if (sType != TokenType.function)
                        type = sType;
                    if (!!jsDocResult.fieldType)
                        type = jsDocResult.fieldType;
                }
                else if (node.right.type == ExpressionType.ObjectExpression) {
                    if (!jsDocResult.fieldType) {
                        type = this.formatObjectExpression(node.right.properties);
                        if (!name)
                            str = TokenType.var + TokenType.space + node.left.name + TokenType.colon + TokenType.space;
                        type = "{\n" + type + "}";
                    }
                    else {
                        type = jsDocResult.fieldType;
                    }
                    metaInfo.addField(name, type, isStatic, false);
                    return str + type + ';\n';
                }
                else if (node.right.type == ExpressionType.ArrayExpression) {
                    type = "Array<any>";
                }
                else if (node.right.type == ExpressionType.FunctionExpression) {
                    var params = node.right.params;
                    var fnFormat = TokenType.functionOpen;
                    for (let i = 0; i < params.length; i++) {
                        fnFormat += params[i].name;
                        if (!!jsDocResult.paramTypes && !!jsDocResult.paramTypes[params[i].name])
                            fnFormat += jsDocResult.paramTypes[params[i].name];
                        if (i != params.length - 1)
                            fnFormat += TokenType.comma;
                    }
                    fnFormat += TokenType.functionClose;
                    if (jsDocResult.returnType && jsDocResult.returnType != TokenType.any)
                        fnFormat += TokenType.colon + jsDocResult.returnType;
                    //metaInfo = new TypeFunctionData(apiName, fnFormat, true);
                    metaInfo.addField(name, fnFormat, true, true);
                    console.log("static function found");
                    return str;
                }
                else if (node.right.type == ExpressionType.NewExpression || node.right.type == ExpressionType.CallExpression) {
                    let jsDocResult = {};
                    if (parent && parent.leadingComments && parent.leadingComments.length > 0)
                        jsDocResult = getJSDocs(parent.leadingComments[0].value);
                    if (!!jsDocResult.fieldType)
                        type = jsDocResult.fieldType;
                }
                else {
                    console.log("Literal not found");
                }
                str += type + TokenType.semicolon;
                metaInfo.addField(name, type, isStatic, false);
                return str;
            },
            formatObjectExpression: function (properties, format = false, isPrototypeChain = false) {
                if (!properties)
                    return "";
                var builder = format ? "{\n" : "";
                for (var i = 0; i < properties.length; i++) {
                    var prop = properties[i];
                    var name = prop.key.name || prop.key.value;
                    let key = name;
                    if (prop.key.name) {
                        builder += name;
                        key = name;
                    }
                    else {
                        builder += prop.key.raw;
                        key = prop.key.raw;
                    }
                    var isConstructor = name == "initialize" && isPrototypeChain && prop.value.type == ExpressionType.FunctionExpression;
                    var paramsStr = "";
                    var value = TokenType.any;
                    var isFunction = false;
                    var paramTypes = {};
                    var returnType = '';
                    var fieldType = TokenType.any;
                    let jsDocResult;
                    if (prop.leadingComments && prop.leadingComments.length != 0) {
                        jsDocResult = getJSDocs(prop.leadingComments[0].value);
                        fieldType = jsDocResult.fieldType;
                        returnType = jsDocResult.returnType;
                        paramTypes = jsDocResult.paramTypes;
                        //console.log(JSON.stringify(jsDocResult));
                        //console.log('finally reached');
                    }
                    // FIXME: solve new expressions in global.IncidentAlertNotifyAjax
                    // it is using SNC.Notify which is not possible in scoped world.
                    if (prop.value.type == ExpressionType.NewExpression || prop.value.type == ExpressionType.CallExpression) {
                        value = fieldType;
                        builder += TokenType.colon + TokenType.space + fieldType;
                    }
                    else if (prop.value.type == ExpressionType.Literal) {
                        let sType = typeof prop.value.value;
                        value = sType;
                        builder += TokenType.colon + TokenType.space + sType;
                    }
                    else if (prop.value.type == ExpressionType.ObjectExpression) {
                        if (fieldType == TokenType.any) {
                            var r = this.formatObjectExpression(prop.value.properties, true);
                            value = r;
                            builder += TokenType.colon + TokenType.space + r;
                        }
                        else {
                            value = fieldType;
                            builder += TokenType.colon + TokenType.space + fieldType;
                        }
                    }
                    else if (prop.value.type == ExpressionType.FunctionExpression) {
                        isFunction = true;
                        var params = prop.value.params;
                        for (let j = 0; j < params.length; j++) {
                            //builder += params[j].name;
                            let paramName = params[j].name;
                            paramsStr += paramName;
                            if (paramTypes[paramName])
                                paramsStr += paramTypes[paramName];
                            if (j != params.length - 1)
                                paramsStr += TokenType.comma;
                        }
                        paramsStr = TokenType.functionOpen + paramsStr + TokenType.functionClose;
                        if (returnType.length > 0 && returnType != TokenType.any || !isPrototypeChain) {
                            if (isPrototypeChain)
                                paramsStr += TokenType.colon + returnType;
                            else {
                                //FIXME: why below statement is not working???
                                //paramsStr += TokenType.arrow + !!returnType? returnType: TokenType.any;
                                paramsStr += TokenType.arrow;
                                if (!!returnType)
                                    paramsStr += returnType;
                                else
                                    paramsStr += TokenType.any;
                            }
                        }
                        paramsStr = overrides[apiName + "." + name] || paramsStr;
                        if (isPrototypeChain)
                            builder += paramsStr;
                        else {
                            builder += TokenType.colon + TokenType.space;
                            builder += paramsStr;
                            //builder += TokenType.arrow + TokenType.any;
                        }
                        if (isConstructor) {
                            metaInfo.setConstructor(paramsStr);
                            let thisAr = parseThisExpression(prop.value.body.body);
                            for (let fieldItem of thisAr) {
                                metaInfo.addField(fieldItem.name, fieldItem.value, !isPrototypeChain, false);
                            }
                        }
                        //metaInfo.addField(key, paramsStr + '=>' + TokenType.any);
                        //value = paramsStr + '=>' + TokenType.any;
                        value = paramsStr;
                    }
                    else if (prop.value.type == ExpressionType.ArrayExpression) {
                        builder += TokenType.colon + TokenType.space + 'Array<any>';
                        value = 'Array<any>';
                        if (fieldType != TokenType.any)
                            value = fieldType;
                    }
                    else {
                        builder += TokenType.colon + TokenType.space + TokenType.any;
                    }
                    if (!isPrototypeChain) {
                        if (i != properties.length - 1)
                            builder += TokenType.comma;
                    }
                    else
                        builder += TokenType.semicolon;
                    if (isPrototypeChain)
                        metaInfo.addField(key, value, !isPrototypeChain, isFunction);
                    builder += TokenType.newline;
                    if (isConstructor && isPrototypeChain) {
                        builder += "\nconstructor";
                        builder += paramsStr;
                        builder += ";";
                        builder += TokenType.newline;
                    }
                }
                if (format)
                    builder += TokenType.blockClose;
                return builder;
            },
            prototypeExpression: function (node, parent) {
                var info = this.getBaseClassInfo();
                return this.formatObjectExpression(info.properties, undefined, true);
            }
        };
        return TSEmittor;
    }
    exports.getEmittor = getEmittor;
    function getDeclaration(siRecord, script, name, esp, parseJSDoc = false) {
        var tokens = name.split(".");
        var simpleName = tokens[tokens.length - 1];
        //var esprima = require("esprima");
        // 1. remove "gs.include("PrototypeServer");" from script
        //script = script.replace('gs.include("PrototypeServer");', '');
        var jsContent = esp.parse(script, { attachComment: true });
        var emittor = getEmittor(siRecord, jsContent, name, parseJSDoc);
        var builder = "";
        stripPrivateTypes(siRecord, jsContent, name);
        var isObjectDeclaration = emittor.isObjectDeclaration(jsContent.body[0]);
        var isFirstNode = true;
        var isFunctionDecl = false;
        let metaInfo;
        for (var i = 0; i < jsContent.body.length; i++) {
            var node = jsContent.body[i];
            //isObjectDeclaration = emittor.isObjectDeclaration(node);
            if (!node)
                continue;
            if (typeof emittor[node.type] == "undefined") {
                console.log("not defined");
                continue;
            }
            var r = "";
            if (isFirstNode) {
                isFirstNode = false;
                r = emittor.anonymousDeclaration(node, jsContent, name);
                isFunctionDecl = emittor.isSingleFunctionExported(node, jsContent, ExpressionType.FunctionDeclaration);
                if (r) {
                    builder += r;
                    continue;
                }
            }
            if (emittor.isPrototype(node, null))
                r = emittor.prototypeExpression(node, jsContent);
            else
                r = emittor[node.type](node, jsContent);
            if (!r)
                continue;
            builder += r + TokenType.newline;
        }
        metaInfo = emittor.getMetaInfo();
        //console.log(metaInfo.exportToTS());
        if (builder.length == 0) {
            console.log("empty came");
        }
        else {
            if (!isObjectDeclaration && !isFunctionDecl)
                builder += TokenType.blockClose;
        }
        return {
            strFormat: builder,
            metaInfo: metaInfo
        };
    }
    function emitDeclarationForScope(tsMetadata) {
        var tsResult = "";
        for (var p in tsMetadata) {
            tsResult += "declare namespace " + p + " {\n";
            var ar = tsMetadata[p];
            var aliasNames = '';
            for (var i = 0; i < ar.length; i++) {
                var tsOb = ar[i];
                tsResult += tsOb.declaration;
                tsResult += "\n";
                //if (!!scope && !(tsOb.accessType == "public" || tsOb.scope == scope))
                //	aliasNames += tsOb.aliasFormat + TokenType.newline;
            }
            tsResult += "}\n";
            tsResult += aliasNames + TokenType.newline;
        }
        return tsResult;
    }
    exports.emitDeclarationForScope = emitDeclarationForScope;
    // export function exportTypeMetaDataFromTypeInfo(typeInfo: Array<TypeData>) {
    // 	let exportedArray = new Array<PublicExportedType>();
    // 	var defEmittor = new DefinitionEmittor();
    // 	for (let i = 0; i < typeInfo.length; i++) {
    // 		let exportedItem = typeInfo[i].exportToTS();
    // 		exportedArray.push(exportedItem);
    // 		defEmittor.addType(exportedItem);
    // 	}
    // 	for (let i = 0; i < exportedArray.length; i++) {
    // 		let exportedItem = exportedArray[i];
    // 		defEmittor.addJSTypeDeclaration(exportedItem);
    // 	}
    // 	defEmittor.doPostProcessing();
    // 	return defEmittor.allJSTypes;
    // }
    function parseSI(si, esp, excludedTypes = {}, parseJSDoc = false) {
        let typeInfo = new Array();
        var tsMetaData = {};
        var parsingErrors = [];
        var emptyDecl = [];
        var availableTypes = {};
        availableTypes["global.StorageDataSize"] = true;
        for (var i = 0; i < si.length; i++) {
            var item = new ClientSIRecordData(si[i]);
            if (excludedTypes[item.sys_id])
                continue;
            item.api_name = item.api_name.trim();
            if (BlockedSI[item.api_name] >= 0)
                continue;
            //if (!availableTypes[item.api_name])
            //	continue;
            console.log("parsing " + item.api_name);
            var declaration = "";
            var tokens = item.api_name.split(".");
            if (!tsMetaData[tokens[0]])
                tsMetaData[tokens[0]] = [];
            var ar = tsMetaData[tokens[0]];
            try {
                let result = getDeclaration(item, item.script, item.api_name, esp, parseJSDoc || !!item.jsdoc);
                declaration = result.strFormat;
                result.metaInfo.setAccessType(item.access);
                result.metaInfo.setSysId(item.sys_id);
                typeInfo.push(result.metaInfo);
                if (!declaration) {
                    emptyDecl.push(item.api_name);
                    console.log("Empty declaration => " + item.api_name);
                }
                ar.push(new TSClassDefinitionFormat(item.api_name, item.sys_scope.value, declaration, item.access, item.sys_id));
            }
            catch (e) {
                parsingErrors.push(item.api_name);
                console.log(" parsing error for => " + item.api_name);
            }
        }
        // generate "class" format
        let allMeta = emitDeclarationForScope(tsMetaData);
        var defEmittor = new DefinitionEmittorForVSCode();
        for (let item of typeInfo) {
            defEmittor.addType(item.exportToTS());
        }
        return {
            getFormat: function (asJSON = false) {
                if (asJSON)
                    return defEmittor.exportJSON();
                else
                    return defEmittor.emit();
            },
            getParsingErrors: function () {
                return parsingErrors;
            },
            getEmptyDeclarations: function () {
                return emptyDecl;
            }
        };
        // generate "interface" format
        // let allJSTypes = exportTypeMetaDataFromTypeInfo(typeInfo);
        // return {
        // 	allMeta: allMeta,
        // 	allJSTypes: allJSTypes,
        // 	parsingErrors: parsingErrors,
        // 	emptyDecl: emptyDecl
        // };
    }
    exports.parseSI = parseSI;
    // https://github.com/yavorskiy/comment-parser
    var JSDocParser;
    (function (JSDocParser) {
        function skipws(str) {
            var i = 0;
            do {
                if (str[i] !== ' ') {
                    return i;
                }
            } while (++i < str.length);
            return i;
        }
        /* ------- default parsers ------- */
        var PARSERS = {
            parse_tag: function parse_tag(str) {
                var result = str.match(/^\s*@(\S+)/);
                if (!result) {
                    throw new Error('Invalid `@tag`, missing @ symbol');
                }
                return {
                    source: result[0],
                    data: { tag: result[1] }
                };
            },
            parse_type: function parse_type(str, data) {
                if (data.errors && data.errors.length) {
                    return null;
                }
                var pos = skipws(str);
                var res = '';
                var curlies = 0;
                if (str[pos] !== '{') {
                    return null;
                }
                while (pos < str.length) {
                    curlies += (str[pos] === '{' ? 1 : (str[pos] === '}' ? -1 : 0));
                    res += str[pos];
                    pos++;
                    if (curlies === 0) {
                        break;
                    }
                }
                if (curlies !== 0) {
                    throw new Error('Invalid `{type}`, unpaired curlies');
                }
                return {
                    source: str.slice(0, pos),
                    data: { type: res.slice(1, -1) }
                };
            },
            parse_name: function parse_name(str, data) {
                if (data.errors && data.errors.length) {
                    return null;
                }
                var pos = skipws(str);
                var name = '';
                var brackets = 0;
                while (pos < str.length) {
                    brackets += (str[pos] === '[' ? 1 : (str[pos] === ']' ? -1 : 0));
                    name += str[pos];
                    pos++;
                    if (brackets === 0 && /\s/.test(str[pos])) {
                        break;
                    }
                }
                if (brackets !== 0) {
                    throw new Error('Invalid `name`, unpaired brackets');
                }
                var res = { name: name, optional: false, default: '' };
                if (/=$/.test(data.type))
                    res.optional = true;
                if (name[0] === '[' && name[name.length - 1] === ']') {
                    res.optional = true;
                    name = name.slice(1, -1);
                    if (name.indexOf('=') !== -1) {
                        var parts = name.split('=');
                        name = parts[0];
                        res.default = parts[1].replace(/^(["'])(.+)(\1)$/, '$2');
                    }
                }
                res.name = name;
                return {
                    source: str.slice(0, pos),
                    data: res
                };
            },
            parse_description: function parse_description(str, data) {
                if (data.errors && data.errors.length) {
                    return null;
                }
                var result = str.match(/^\s+((.|\s)+)?/);
                if (result) {
                    return {
                        source: result[0],
                        data: { description: result[1] === undefined ? '' : result[1] }
                    };
                }
                return null;
            }
        };
        var MARKER_START = '/**';
        var MARKER_START_SKIP = '/***';
        var MARKER_END = '*/';
        /* ------- util functions ------- */
        function merge(...args) {
            var k, obj;
            var res = {};
            var objs = Array.prototype.slice.call(arguments);
            for (var i = 0, l = objs.length; i < l; i++) {
                obj = objs[i];
                for (k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        res[k] = obj[k];
                    }
                }
            }
            return res;
        }
        function find(list, filter) {
            var k;
            var i = list.length;
            var matchs = true;
            while (i--) {
                for (k in filter) {
                    if (filter.hasOwnProperty(k)) {
                        matchs = (filter[k] === list[i][k]) && matchs;
                    }
                }
                if (matchs) {
                    return list[i];
                }
            }
            return null;
        }
        /* ------- parsing ------- */
        /**
         * Parses "@tag {type} name description"
         * @param {string} str Raw doc string
         * @param {Array[function]} parsers Array of parsers to be applied to the source
         * @returns {object} parsed tag node
         */
        function parse_tag(str, parsers) {
            if (typeof str !== 'string' || str[0] !== '@') {
                return null;
            }
            var data = parsers.reduce(function (state, parser) {
                var result;
                try {
                    result = parser(state.source, merge({}, state.data));
                }
                catch (err) {
                    state.data.errors = (state.data.errors || [])
                        .concat(parser.name + ': ' + err.message);
                }
                if (result) {
                    state.source = state.source.slice(result.source.length);
                    state.data = merge(state.data, result.data);
                }
                return state;
            }, {
                source: str,
                data: {}
            }).data;
            data.optional = !!data.optional;
            if (data.optional && !!data.type)
                data.type = data.type.substring(0, data.type.length - 1);
            data.type = data.type === undefined ? '' : data.type;
            data.name = data.name === undefined ? '' : data.name;
            data.description = data.description === undefined ? '' : data.description;
            return data;
        }
        /**
         * Parses comment block (array of String lines)
         */
        function parse_block(source, opts) {
            var trim = opts.trim
                ? function trim(s) { return s.trim(); }
                : function trim(s) { return s; };
            var source_str = source
                .map(function (line) { return trim(line.source); })
                .join('\n');
            source_str = trim(source_str);
            var start = source[0].number;
            // merge source lines into tags
            // we assume tag starts with "@"
            source = source
                .reduce(function (tags, line) {
                line.source = trim(line.source);
                if (line.source.match(/^\s*@(\w+)/)) {
                    tags.push({ source: [line.source], line: line.number });
                }
                else {
                    var tag = tags[tags.length - 1];
                    if (opts.join !== undefined && opts.join !== false && opts.join !== 0 &&
                        !line.startWithStar && tag.source.length > 0) {
                        var source;
                        if (typeof opts.join === 'string') {
                            source = opts.join + line.source.replace(/^\s+/, '');
                        }
                        else if (typeof opts.join === 'number') {
                            source = line.source;
                        }
                        else {
                            source = ' ' + line.source.replace(/^\s+/, '');
                        }
                        tag.source[tag.source.length - 1] += source;
                    }
                    else {
                        tag.source.push(line.source);
                    }
                }
                return tags;
            }, [{ source: [] }])
                .map(function (tag) {
                tag.source = trim(tag.source.join('\n'));
                return tag;
            });
            // Block description
            var description = source.shift();
            // skip if no descriptions and no tags
            if (description.source === '' && source.length === 0) {
                return null;
            }
            var tags = source.reduce(function (tags, tag) {
                var tag_node = parse_tag(tag.source, opts.parsers);
                if (!tag_node) {
                    return tags;
                }
                tag_node.line = tag.line;
                tag_node.source = tag.source;
                if (opts.dotted_names && tag_node.name.indexOf('.') !== -1) {
                    var parent_name;
                    var parent_tag;
                    var parent_tags = tags;
                    var parts = tag_node.name.split('.');
                    while (parts.length > 1) {
                        parent_name = parts.shift();
                        parent_tag = find(parent_tags, {
                            tag: tag_node.tag,
                            name: parent_name
                        });
                        if (!parent_tag) {
                            parent_tag = {
                                tag: tag_node.tag,
                                line: Number(tag_node.line),
                                name: parent_name,
                                type: '',
                                description: ''
                            };
                            parent_tags.push(parent_tag);
                        }
                        parent_tag.tags = parent_tag.tags || [];
                        parent_tags = parent_tag.tags;
                    }
                    tag_node.name = parts[0];
                    parent_tags.push(tag_node);
                    return tags;
                }
                return tags.concat(tag_node);
            }, []);
            return {
                tags: tags,
                line: start,
                description: description.source,
                source: source_str
            };
        }
        /**
         * Produces `extract` function with internal state initialized
         */
        function mkextract(opts) {
            var chunk;
            var indent = 0;
            var number = 0;
            opts = merge({}, {
                trim: true,
                dotted_names: false,
                parsers: [
                    PARSERS.parse_tag,
                    PARSERS.parse_type,
                    PARSERS.parse_name,
                    PARSERS.parse_description
                ]
            }, opts || {});
            /**
             * Read lines until they make a block
             * Return parsed block once fullfilled or null otherwise
             */
            return function extract(line) {
                var result;
                var startPos = line.indexOf(MARKER_START);
                var endPos = line.indexOf(MARKER_END);
                // if open marker detected and it's not skip one
                if (startPos !== -1 && line.indexOf(MARKER_START_SKIP) !== startPos) {
                    chunk = [];
                    indent = startPos + MARKER_START.length;
                }
                // if we are on middle of comment block
                if (chunk) {
                    var lineStart = indent;
                    var startWithStar = false;
                    // figure out if we slice from opening marker pos
                    // or line start is shifted to the left
                    var nonSpaceChar = line.match(/\S/);
                    // skip for the first line starting with /** (fresh chunk)
                    // it always has the right indentation
                    if (chunk.length > 0 && nonSpaceChar) {
                        if (nonSpaceChar[0] === '*') {
                            lineStart = nonSpaceChar.index + 2;
                            startWithStar = true;
                        }
                        else if (nonSpaceChar.index < indent) {
                            lineStart = nonSpaceChar.index;
                        }
                    }
                    // slice the line until end or until closing marker start
                    chunk.push({
                        number: number,
                        startWithStar: startWithStar,
                        source: line.slice(lineStart, endPos === -1 ? line.length : endPos)
                    });
                    // finalize block if end marker detected
                    if (endPos !== -1) {
                        result = parse_block(chunk, opts);
                        chunk = null;
                        indent = 0;
                    }
                }
                number += 1;
                return result;
            };
        }
        /* ------- Public API ------- */
        function parse(source, opts) {
            var block;
            var blocks = [];
            var extract = mkextract(opts);
            var lines = source.split(/\n/);
            for (var i = 0, l = lines.length; i < l; i++) {
                block = extract(lines.shift());
                if (block) {
                    blocks.push(block);
                }
            }
            return blocks;
        }
        JSDocParser.parse = parse;
    })(JSDocParser || (JSDocParser = {}));
    const overrides = {
        "global.PwdEmailNotificationManager._sendCodeToDevices": "(devices, code, userSysId?: string)",
        "global.OCDHTMLXCalendarFormatter.initialize": "(groupEvents?: any)",
        "global.OCRotationV2.initialize": "(schedulePage, formatter?: any)",
        "global.WorkflowIconsSCR.initialize": "(ref?: any)",
        "global.KnowledgeTypeDefaultsAjax.getValue": "(ge?: any)",
        "global.SchedulePriorityECCJob.initialize": "(label?: any, document?: any, script?: any)",
        "global.ClientTestRunnerBrowserInfo.initialize": "(browserName, version, osName, osVersion?: any)",
        "global.PwdSMSNotificationManager._sendCodeToDevices": "(devices, code, userSysId?: string)",
        "global.KBViewModelSNC.getKnowledgeRecord": "(query?: any, value?: any, stopWorkflow?: any)",
        "global.KBMyKnowledgeSNC.initialize": "(type?: any, windowStart?: any)",
        "global.sc_ic_RequestedItem.initialize": "(_gr, _gs, _workflow?: any)",
        "global.StdChangeUtilsSNC.getValue": "(property?: any)",
        "sn_schedule_pages.CMNScheduleRESTWrapper.getEvents": "(params?: any)",
        "sn_schedule_pages.CMNScheduleRESTWrapper.updateEvent": "(params?: any)",
        "sn_comm_management.CommunicationManagementChannelAbstractSNC.getConfig": "(sourceTable: string)"
    };
    var TSChecker;
    (function (TSChecker) {
        let LiteralType;
        (function (LiteralType) {
            LiteralType[LiteralType["NumericLiteral"] = 0] = "NumericLiteral";
            LiteralType[LiteralType["StringLiteral"] = 1] = "StringLiteral";
            LiteralType[LiteralType["StringType"] = 2] = "StringType";
            LiteralType[LiteralType["FunctionType"] = 3] = "FunctionType";
            LiteralType[LiteralType["ObjectLiteral"] = 4] = "ObjectLiteral";
            LiteralType[LiteralType["AnonymouseStringLiteral"] = 5] = "AnonymouseStringLiteral";
        })(LiteralType = TSChecker.LiteralType || (TSChecker.LiteralType = {}));
        class RawFieldType {
            constructor(name, type, doc, isStringPropertyElement = false) {
                this.name = name;
                this.type = type;
                this.doc = doc;
                this.isStringPropertyElement = isStringPropertyElement;
            }
            setLineInfo(lineInfo) {
                this.lineInfo = lineInfo;
                return this;
            }
            toJSONDecl() {
                var r = {};
                r.f = this.toTypeFormat();
                if (this.lineInfo) {
                    r.l = this.lineInfo.line;
                    if (this.lineInfo.doc)
                        r.d = this.lineInfo.doc;
                }
                return r;
            }
            setDoc(doc) {
                this.doc = doc;
            }
            setAsElement() {
                this.isStringPropertyElement = true;
            }
            static isNumericType(rawType) {
                return rawType instanceof RawFieldType && rawType.type == LiteralType.NumericLiteral;
            }
            static isStringLiteral(rawType) {
                return rawType instanceof RawFieldType && rawType.type == LiteralType.StringLiteral;
            }
            static isStringType(rawType) {
                return rawType instanceof RawFieldType;
            }
            static isParamType(rawType) {
                return rawType instanceof ParamInfoType;
            }
            static isFunctionType(rawType) {
                return rawType instanceof RawFieldType && rawType.type == LiteralType.FunctionType;
            }
            static isRawFunctionType(rawType) {
                return rawType instanceof RawFunctionType;
            }
            static isObjectLiteral(rawType) {
                return rawType instanceof RawFieldType && rawType.type == LiteralType.ObjectLiteral;
            }
            static isAnonymousStringType(rawType) {
                return rawType instanceof RawFieldType && rawType.type == LiteralType.AnonymouseStringLiteral;
            }
            getPropertyName() {
                if (this.isStringPropertyElement)
                    return this.name;
                var tokens = this.name.split('.');
                return tokens[tokens.length - 1];
            }
            isStatic() {
                var tokens = this.name.split('.');
                if (tokens.length < 2)
                    return false;
                if (tokens[1] == 'prototype')
                    return false;
                return true;
            }
        }
        TSChecker.RawFieldType = RawFieldType;
        class NumericLiteralType extends RawFieldType {
            constructor(name, doc) {
                super(name, LiteralType.NumericLiteral, doc);
            }
            toTypeFormat() {
                return this.getPropertyName() + ': ' + 'number';
            }
        }
        TSChecker.NumericLiteralType = NumericLiteralType;
        class StringLiteralType extends RawFieldType {
            constructor(name, doc) {
                super(name, LiteralType.StringLiteral, doc);
            }
            toTypeFormat() {
                return this.getPropertyName() + ': ' + 'string';
            }
        }
        TSChecker.StringLiteralType = StringLiteralType;
        class StringType extends RawFieldType {
            constructor(name, type, doc) {
                super(name, LiteralType.StringType, doc);
                if (type == 'true' || type == 'false')
                    type = 'boolean';
                type = type.replace(/undefined\[\]/g, 'Array<any>');
                this.rawType = type;
            }
            toTypeFormat() {
                return this.getPropertyName() + ': ' + this.rawType;
            }
        }
        TSChecker.StringType = StringType;
        class ParamInfoType extends StringType {
            constructor(name, type, isOpt = false, doc) {
                super(name, type, doc);
                this.isOpt = isOpt;
            }
            toTypeFormat() {
                if (this.isOpt)
                    return this.name + (this.isOpt ? '?: ' : ': ') + this.rawType;
                if (this.rawType != 'any')
                    return this.name + ': ' + this.rawType;
                return this.name;
            }
        }
        TSChecker.ParamInfoType = ParamInfoType;
        class AnonymousStringType extends StringType {
            constructor(type, doc) {
                super('', type, doc);
            }
            toTypeFormat() {
                if (this.rawType == 'any')
                    return '';
                return this.rawType;
            }
        }
        TSChecker.AnonymousStringType = AnonymousStringType;
        class RawFunctionType extends StringType {
            constructor(name, type, returnType, templateBody, doc) {
                super(name, type, doc);
                this.returnType = returnType;
                this.templateBody = templateBody;
            }
            getParts() {
                var fnBody = '';
                if (!!this.templateBody)
                    fnBody = this.templateBody;
                fnBody += this.rawType;
                var returnType;
                if (this.returnType && this.returnType != 'any')
                    returnType = this.returnType;
                return {
                    name: this.getPropertyName(),
                    body: fnBody,
                    returnType: returnType
                };
            }
            getParamsFormat() {
                var parts = this.getParts();
                return parts.body;
            }
            getClsFunctionFormat() {
                var parts = this.getParts();
                if (!!parts.returnType)
                    return parts.body;
                return parts.body + ': ' + parts.returnType;
            }
            toTypeFormat() {
                var str = '';
                var parts = this.getParts();
                str = parts.name + parts.body;
                if (!!parts.returnType)
                    str += ': ' + parts.returnType;
                return str;
            }
        }
        TSChecker.RawFunctionType = RawFunctionType;
        function tryGetFunctionPartsFromString(str) {
            var result = {
                template: '',
                paramBody: '',
                returnType: ''
            };
            function getStartAndEnd(startIndex, start, end) {
                if (!(str[0] == '<' || str[0] == '('))
                    throw 'Not a function';
                var index = -1;
                var counter = 0;
                var found = false;
                for (; startIndex < str.length; startIndex++) {
                    if (str[startIndex] == start) {
                        if (index == -1)
                            index = startIndex;
                        counter++;
                    }
                    if (str[startIndex] == end) {
                        counter--;
                        if (counter == 0) {
                            startIndex++;
                            found = true;
                            break;
                        }
                    }
                }
                return {
                    start: index,
                    length: found ? startIndex - index : 0
                };
            }
            var templateResult = getStartAndEnd(0, '<', '>');
            var index = 0;
            if (templateResult.length != 0) {
                result.template = str.substr(templateResult.start, templateResult.length);
                index = 1;
            }
            var paramResult = getStartAndEnd(index, '(', ')');
            if (paramResult.length == 0)
                throw "Not a arrow function";
            result.paramBody = str.substr(paramResult.start, paramResult.length);
            var arrowIndex = paramResult.start + paramResult.length;
            var arrowStr = str.substr(arrowIndex).trim();
            if (arrowStr.indexOf('=>') == 0)
                arrowStr = arrowStr.replace('=>', '').trim();
            else
                throw 'Not a function'; // test_5015.txt
            result.returnType = arrowStr;
            return result;
        }
        // function isArrowFunctionString(str: string) {
        // 	if (!(str[0] == '<' || str[0] == '('))
        // 		return false;
        // 	var ar = [];
        // 	var counter = 0;
        // 	var index = 0;
        // 	var tokens = str.split('');
        // 	for (; index < str.length; index++) {
        // 		if (tokens[index] == '(')
        // 			counter++;
        // 		if (tokens[index] == ')') {
        // 			counter--;
        // 			if (counter == 0)
        // 				break;
        // 		}
        // 	}
        // 	if (index == str.length)
        // 		return false;
        // 	var arrowStr = str.substring(index).trim();
        // 	if (arrowStr.startsWith('=>'))
        // 		return true;
        // }
        class FunctionType extends RawFieldType {
            /**
             * constructor for function expression and function declaration
             * @param name function name
             * @param doc associated docment
             */
            constructor(name, doc) {
                super(name, LiteralType.FunctionType, doc);
            }
            getParts() {
                var fnName = this.getPropertyName();
                var fnBody = '';
                if (Array.isArray(this.typeParams) && this.typeParams.length > 0)
                    fnBody = '<' + this.typeParams.join(', ') + '>';
                if (Array.isArray(this.params) && this.params.length > 0) {
                    var paramFormat = [];
                    this.params.map(par => {
                        paramFormat.push(par.toTypeFormat());
                    });
                    fnBody += '(' + paramFormat.join(',') + ')';
                }
                else
                    fnBody = '()';
                var returnType;
                if (this.returnType && this.returnType != 'any')
                    returnType = this.returnType;
                return {
                    name: fnName,
                    body: fnBody,
                    returnType: returnType
                };
            }
            getParamsFormat() {
                var parts = this.getParts();
                return parts.body;
            }
            getClsFunctionFormat() {
                var parts = this.getParts();
                if (!parts.returnType || !!parts.returnType && parts.returnType == 'any')
                    return parts.body;
                return parts.body + ': ' + parts.returnType;
            }
            toTypeFormat() {
                var parts = this.getParts();
                if (!parts.returnType || !!parts.returnType && parts.returnType == 'any')
                    return parts.name + parts.body;
                return parts.name + parts.body + ': ' + parts.returnType;
            }
            addParam(paramName, paramType, isOptional = false, doc) {
                if (!Array.isArray(this.params))
                    this.params = new Array();
                this.params.push(new ParamInfoType(paramName, paramType, isOptional, doc));
            }
            setReturnType(type, returnDoc) {
                this.returnType = type;
                this.returnDoc = returnDoc;
            }
            setTypeParams(typeParams) {
                if (Array.isArray(typeParams) && typeParams.length > 0)
                    this.typeParams = typeParams;
            }
            static create(name, item) {
                var fnType = new FunctionType(name, item.documentation);
                item.parameters.forEach(par => {
                    fnType.addParam(par.name, par.type, par.isOptional, par.documentation);
                });
                if (item.lineInfo)
                    fnType.setLineInfo(item.lineInfo);
                fnType.setReturnType(item.returnType);
                fnType.setTypeParams(item.typeParams);
                return fnType;
            }
        }
        TSChecker.FunctionType = FunctionType;
        class RawStringObjectLiteralType extends RawFieldType {
            constructor(name, typeFormat, doc) {
                super(name, LiteralType.StringType);
                this.typeFormat = typeFormat;
            }
            toTypeFormat() {
                return this.typeFormat;
            }
            toJSONDecl() {
                var str = this.toTypeFormat().trim();
                if (str.startsWith('{'))
                    str = str.substring(1);
                if (str.endsWith('}'))
                    str = str.substr(0, str.length - 1);
                str = str.trim();
                return {
                    l: 0,
                    f: str
                };
            }
        }
        TSChecker.RawStringObjectLiteralType = RawStringObjectLiteralType;
        class ObjectLiteraltype extends RawFieldType {
            constructor(name, doc) {
                super(name, LiteralType.ObjectLiteral, doc);
            }
            addField(field) {
                this.keys[field.name] = field;
            }
            setKeysType(newKeys) {
                this.keys = newKeys;
            }
            getPartsWithLineInfo() {
                var result = [];
                for (var prop in this.keys) {
                    let df = {};
                    df.f = this.keys[prop].toTypeFormat();
                    if (this.keys[prop].lineInfo) {
                        df.l = this.keys[prop].lineInfo.line;
                        if (this.keys[prop].lineInfo.doc)
                            df.d = this.keys[prop].lineInfo.doc;
                    }
                    result.push(df);
                }
                return result;
            }
            getParts() {
                var result = [];
                for (var prop in this.keys)
                    result.push(this.keys[prop].toTypeFormat());
                return result;
            }
            toTypeFormat() {
                var str = '{\n';
                var parts = this.getParts();
                str += parts.join(';\n');
                str += '\n}';
                return str;
            }
        }
        TSChecker.ObjectLiteraltype = ObjectLiteraltype;
        // enum JSType {
        // 	obj = 1,
        // 	fun = 1 << 1,
        // 	cls = 1 << 2,
        // 	es6 = 1 << 3
        // }
        function typeToDisplayParts(checker, typeNode, rootNode, flags) {
            //@ts-ignore
            return ts.typeToDisplayParts(checker, typeNode, rootNode, flags /* InTypeAlias */);
        }
        class TSTypeExporter extends TypeData {
            constructor(currentSI, apiName, accessType, sysId) {
                super(currentSI, apiName, accessType, sysId);
                this.fields = {};
                this.flags = 0;
                this.isES6 = false;
            }
            setAsES6() {
                this.isES6 = true;
                this.flags |= SIFlags.jsES6;
            }
            getInternalType() {
                if (this.isClass() || this.isSubClass())
                    return JSExportedTypes.cls;
                if (this.isFunctionType())
                    return JSExportedTypes.fun;
                if (this.isObjectLiteral())
                    return JSExportedTypes.var;
                return JSExportedTypes.never;
            }
            clearAll() {
                this.fields = {};
            }
            exportToTS() {
                var p;
                return p;
            }
            addConstructorFunction(constructorSign) {
                this.constFun = constructorSign;
            }
            addField(fieldType) {
                // if (fieldType instanceof ObjectLiteraltype) {
                // 	var tokens = fieldType.name.split('.');
                // 	if (tokens.length > 1) {
                // 		let keys = Object.keys(this.fields);
                // 	}
                // }
                var tokens = fieldType.name.split('.');
                if (tokens.length > 1 && tokens[1] == 'prototype')
                    this.setAsClass();
                else {
                    if (this.isObjectLiteral()) {
                        let tokens = fieldType.name.split('.');
                        let objType = this.fields[tokens[0]];
                        if (objType instanceof ObjectLiteraltype) {
                            if (tokens.length == 2) {
                                fieldType.name = tokens[1];
                                objType.addField(fieldType);
                            }
                        }
                        return;
                    }
                }
                this.fields[fieldType.name] = fieldType;
            }
            exportAliasName(isInNamespace) {
                return "";
            }
            isSubClass() {
                return !!this.baseName;
            }
            setBaseType(baseName) {
                this.baseName = baseName;
            }
            setAsFunction() {
                this.resetState();
                this.flags |= SIFlags.fun;
            }
            isFunctionType() {
                return !!(this.flags & SIFlags.fun);
            }
            setAsObjectLiteral() {
                this.resetState();
                this.flags |= SIFlags.obj;
            }
            isObjectLiteral() {
                return !!(this.flags & SIFlags.obj);
            }
            resetState() {
                this.flags = 0;
            }
            setAsClass() {
                this.resetState();
                this.flags |= SIFlags.cls;
            }
            isClass() {
                return !!(this.flags & SIFlags.cls);
            }
            addTypedefData(p) {
                if (!this.typeDefs)
                    this.typeDefs = [];
                this.typeDefs.push(p);
            }
            toMinifiedInterfaceFormat_1() {
                var tokens = this.apiName.split('.');
                var scopeName = tokens[0];
                var simpleName = tokens[1];
                let memberFormat = '';
                let staticFormat = '';
                var props = Object.keys(this.fields);
                var initFun;
                var prototypeFormat = '';
                if (this.flags == 0) {
                    // test_5013.txt
                    if (Object.keys(this.fields).length == 1) {
                        let f1 = this.fields[simpleName];
                    }
                }
                if (this.isObjectLiteral()) {
                    //let str = 'interface ' + simpleName + ' ';
                    let str = '';
                    for (let prop in this.fields) {
                        if (this.fields[prop] instanceof ObjectLiteraltype) {
                            str += this.fields[prop].toTypeFormat();
                        }
                        else if (this.fields[prop] instanceof RawStringObjectLiteralType) {
                            str += this.fields[prop].toTypeFormat();
                        }
                    }
                    let siFormat = {
                        api: simpleName,
                        id: this.sysId,
                        tf: str,
                        f: 0
                    };
                    SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
                    return siFormat;
                }
                props.forEach(prop => {
                    let field = this.fields[prop];
                    let fieldFormat = '';
                    if (prop == simpleName + '.prototype') {
                        if (RawFieldType.isObjectLiteral(field)) {
                            fieldFormat = field.getParts().join(';\n');
                            if (fieldFormat.length > 0)
                                memberFormat += fieldFormat + ';\n';
                            var initField = field.keys['initialize'];
                            if (initField && RawFieldType.isFunctionType(initField))
                                initFun = initField;
                        }
                        else if (RawFieldType.isStringType(field)) {
                            prototypeFormat = field.rawType;
                            if (!(prototypeFormat[0] == '{' && prototypeFormat[prototypeFormat.length - 1]))
                                prototypeFormat = '';
                        }
                    }
                    else {
                        fieldFormat = field.toTypeFormat() + ';\n';
                        if (field.isStatic()) {
                            if (RawFieldType.isObjectLiteral(field))
                                staticFormat += field.getPropertyName() + ': ' + fieldFormat;
                            else
                                staticFormat += fieldFormat;
                        }
                        else {
                            if (RawFieldType.isObjectLiteral(field)) {
                                memberFormat += field.getPropertyName() + ': ' + fieldFormat;
                            }
                            else
                                memberFormat += fieldFormat;
                        }
                    }
                });
                if (this.isClass()) {
                    var constStr = 'new';
                    initFun = initFun || this.constFun;
                    if (initFun)
                        constStr += initFun.getParamsFormat() + ': ' + this.apiName;
                    else
                        constStr += '(): ' + this.apiName;
                    staticFormat = constStr + ';\nprototype: ' + this.apiName + ';\n' + staticFormat;
                }
                if (this.isFunctionType()) {
                    if (!!this.constFun) {
                        if (this.constFun instanceof FunctionType)
                            staticFormat = this.constFun.getClsFunctionFormat() + ';\n' + staticFormat;
                        else if (this.constFun instanceof RawFunctionType) {
                            staticFormat = this.constFun.rawType + ': ' + this.constFun.returnType + ';\n' + staticFormat;
                        }
                    }
                }
                if (prototypeFormat.length > 0) {
                    prototypeFormat = prototypeFormat.substring(1);
                    prototypeFormat = prototypeFormat.substr(0, prototypeFormat.length - 1);
                    memberFormat += '\n' + prototypeFormat;
                }
                let tf = [];
                let str = '';
                tf.push(memberFormat.trim());
                tf.push(staticFormat.trim());
                var siFormat = {
                    api: simpleName,
                    id: this.sysId,
                    f: 0,
                    tf: tf
                };
                if (this.isSubClass())
                    siFormat.sp = this.baseName;
                if (!!this.typeDefs)
                    siFormat.td = this.typeDefs;
                SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
                return siFormat;
            }
            toMinifiedInterfaceFormat() {
                var tokens = this.apiName.split('.');
                var scopeName = tokens[0];
                var simpleName = tokens[1];
                let memberFormat = '';
                let staticFormat = '';
                var props = Object.keys(this.fields);
                var initFun;
                var prototypeFormat = '';
                if (this.flags == 0) {
                    // test_5013.txt
                    if (Object.keys(this.fields).length == 1) {
                        let f1 = this.fields[simpleName];
                    }
                }
                if (this.isES6) {
                    let siFormat = {
                        api: simpleName,
                        id: this.sysId,
                        f: this.flags
                    };
                    if (typeof this.typeDefs !== 'undefined')
                        siFormat.td = this.typeDefs;
                    return siFormat;
                }
                if (this.isObjectLiteral()) {
                    //let str = 'interface ' + simpleName + ' ';
                    let str = '';
                    let df = [];
                    for (let prop in this.fields) {
                        if (this.fields[prop] instanceof ObjectLiteraltype) {
                            str += this.fields[prop].toTypeFormat();
                        }
                        else if (this.fields[prop] instanceof RawStringObjectLiteralType) {
                            str += this.fields[prop].toTypeFormat();
                            df.push(this.fields[prop].toJSONDecl());
                        }
                    }
                    let exportedType = this.fields[simpleName];
                    if (exportedType.keys) {
                        for (let prop in exportedType.keys) {
                            df.push(exportedType.keys[prop].toJSONDecl());
                        }
                    }
                    let siFormat = {
                        api: simpleName,
                        id: this.sysId,
                        //tf: str,
                        df: df,
                        f: 0
                    };
                    SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
                    return siFormat;
                }
                let df = [];
                let staticDeclFormat = [];
                props.forEach(prop => {
                    let field = this.fields[prop];
                    let fieldFormat = '';
                    if (prop == simpleName + '.prototype') {
                        if (RawFieldType.isObjectLiteral(field)) {
                            df = field.getPartsWithLineInfo();
                            fieldFormat = field.getParts().join(';\n');
                            if (fieldFormat.length > 0)
                                memberFormat += fieldFormat + ';\n';
                            var initField = field.keys['initialize'];
                            if (initField && RawFieldType.isFunctionType(initField))
                                initFun = initField;
                        }
                        else if (RawFieldType.isStringType(field)) {
                            prototypeFormat = field.rawType;
                            if (!(prototypeFormat[0] == '{' && prototypeFormat[prototypeFormat.length - 1]))
                                prototypeFormat = '';
                        }
                    }
                    else {
                        fieldFormat = field.toTypeFormat() + ';\n';
                        let lineInfo = field.lineInfo;
                        var thisFieldDF = {};
                        thisFieldDF.l = lineInfo.line;
                        if (lineInfo.doc)
                            thisFieldDF.d = lineInfo.doc;
                        if (field.isStatic()) {
                            staticDeclFormat.push(thisFieldDF);
                            if (RawFieldType.isObjectLiteral(field)) {
                                thisFieldDF.f = field.getPropertyName() + ': ' + field.toTypeFormat();
                                staticFormat += field.getPropertyName() + ': ' + fieldFormat;
                            }
                            else {
                                thisFieldDF.f = field.toTypeFormat();
                                staticFormat += fieldFormat;
                            }
                        }
                        else {
                            df.push(thisFieldDF);
                            if (RawFieldType.isObjectLiteral(field)) {
                                thisFieldDF.f = field.getPropertyName() + ': ' + field.toTypeFormat();
                                memberFormat += field.getPropertyName() + ': ' + fieldFormat;
                            }
                            else {
                                thisFieldDF.f = field.toTypeFormat();
                                memberFormat += fieldFormat;
                            }
                        }
                    }
                });
                if (this.isClass()) {
                    var constStr = 'new';
                    initFun = initFun || this.constFun;
                    let constDecl = {};
                    staticDeclFormat.push(constDecl);
                    if (initFun) {
                        constStr += initFun.getParamsFormat() + ': ' + this.apiName;
                        constDecl.f = constStr;
                        if (initFun.lineInfo) {
                            constDecl.l = initFun.lineInfo.line;
                            if (initFun.doc)
                                constDecl.d = initFun.doc;
                        }
                    }
                    else {
                        constStr += '(): ' + this.apiName;
                        constDecl.f = constStr;
                        constDecl.l = 0;
                    }
                    let prototypeDF = {};
                    prototypeDF.f = `prototype: ${this.apiName}`;
                    prototypeDF.l = 0;
                    staticDeclFormat.push(prototypeDF);
                    staticFormat = constStr + ';\nprototype: ' + this.apiName + ';\n' + staticFormat;
                }
                if (this.isFunctionType()) {
                    if (!!this.constFun) {
                        let constDF = {};
                        constDF.l = 0;
                        constDF.f = '';
                        staticDeclFormat.push(constDF);
                        if (this.constFun instanceof FunctionType) {
                            staticFormat = this.constFun.getClsFunctionFormat() + ';\n' + staticFormat;
                            constDF.f = this.constFun.getClsFunctionFormat();
                        }
                        else if (this.constFun instanceof RawFunctionType) {
                            staticFormat = this.constFun.rawType + ': ' + this.constFun.returnType + ';\n' + staticFormat;
                            constDF.f = this.constFun.rawType + ': ' + this.constFun.returnType;
                        }
                    }
                }
                if (prototypeFormat.length > 0) {
                    console.warn("fix this extra user case");
                    prototypeFormat = prototypeFormat.substring(1);
                    prototypeFormat = prototypeFormat.substr(0, prototypeFormat.length - 1);
                    memberFormat += '\n' + prototypeFormat;
                }
                let tf = [];
                let str = '';
                tf.push(memberFormat.trim());
                tf.push(staticFormat.trim());
                var siFormat = {
                    api: simpleName,
                    id: this.sysId,
                    f: 0,
                    //tf: tf,
                    df: [df, staticDeclFormat]
                };
                if (this.isSubClass())
                    siFormat.sp = this.baseName;
                if (!!this.typeDefs)
                    siFormat.td = this.typeDefs;
                SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
                return siFormat;
            }
            toInterfaceFormat() {
                var tokens = this.apiName.split('.');
                var scopeName = tokens[0];
                var simpleName = tokens[1];
                let memberFormat = '';
                let staticFormat = '';
                var props = Object.keys(this.fields);
                var initFun;
                var prototypeFormat = '';
                if (this.flags == 0) {
                    // test_5013.txt
                    if (Object.keys(this.fields).length == 1) {
                        let f1 = this.fields[simpleName];
                        console.log('unknown type');
                    }
                }
                if (this.isObjectLiteral()) {
                    let str = 'interface ' + simpleName + ' ';
                    for (let prop in this.fields) {
                        str += this.fields[prop].toTypeFormat();
                    }
                    //let aliasFormat = 'export const ' + simpleName + ': ' + simpleName + ';';
                    //let globalAliasFormat = 'import ' + simpleName + ' = ' + this.apiName + ';';
                    let aliasFormat = 'const ' + simpleName + ': ' + simpleName + ';';
                    let globalAliasFormat = 'declare const ' + simpleName + ': ' + this.apiName + ';';
                    let siFormat = new SITSFormat(this.apiName, this.sysId, str, aliasFormat, globalAliasFormat, this.accessType, JSExportedTypes.var, 0, this.typeDefs);
                    SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
                    return siFormat;
                }
                props.forEach(prop => {
                    let field = this.fields[prop];
                    let fieldFormat = '';
                    if (prop == simpleName + '.prototype') {
                        if (RawFieldType.isObjectLiteral(field)) {
                            fieldFormat = field.getParts().join(';\n');
                            memberFormat += fieldFormat + ';\n';
                            var initField = field.keys['initialize'];
                            if (initField && RawFieldType.isFunctionType(initField))
                                initFun = initField;
                        }
                        else if (RawFieldType.isStringType(field)) {
                            prototypeFormat = field.rawType;
                            if (!(prototypeFormat[0] == '{' && prototypeFormat[prototypeFormat.length - 1]))
                                prototypeFormat = '';
                        }
                    }
                    else {
                        fieldFormat = field.toTypeFormat() + ';\n';
                        if (field.isStatic()) {
                            if (RawFieldType.isObjectLiteral(field))
                                staticFormat += field.getPropertyName() + ': ' + fieldFormat;
                            else
                                staticFormat += fieldFormat;
                        }
                        else {
                            memberFormat += fieldFormat;
                        }
                    }
                });
                if (this.isClass()) {
                    var constStr = 'new';
                    if (initFun)
                        constStr += initFun.getParamsFormat() + ': ' + this.apiName;
                    else
                        constStr += '(): ' + this.apiName;
                    staticFormat = constStr + ';\nprototype: ' + this.apiName + ';\n' + staticFormat;
                }
                if (this.isFunctionType()) {
                    if (!!this.constFun) {
                        if (this.constFun instanceof FunctionType)
                            staticFormat = this.constFun.getClsFunctionFormat() + ';\n' + staticFormat;
                        else if (this.constFun instanceof RawFunctionType)
                            staticFormat = this.constFun.rawType + ': ' + this.constFun.returnType + ';\n' + staticFormat;
                    }
                }
                if (prototypeFormat.length > 0) {
                    prototypeFormat = prototypeFormat.substring(1);
                    prototypeFormat = prototypeFormat.substr(0, prototypeFormat.length - 1);
                    memberFormat += '\n' + prototypeFormat;
                }
                let str = 'interface ' + simpleName;
                if (this.isSubClass())
                    str += ' extends ' + this.baseName;
                memberFormat = memberFormat.trim();
                str += ' {\n' + memberFormat + '\n}';
                let str1 = 'interface ' + simpleName + 'Constructor {\n';
                staticFormat = staticFormat.trim();
                str1 += staticFormat + '\n}';
                let typeFormat = str + '\n' + str1;
                //let aliasFormat = 'export const ' + simpleName + ': ' + simpleName + 'Constructor;';
                //let globalAliasFormat = 'import ' + simpleName + ' = ' + this.apiName + ';';
                let aliasFormat = 'const ' + simpleName + ': ' + simpleName + 'Constructor;';
                var globalAliasFormat = 'declare const ' + simpleName + ': ' + this.apiName + 'Constructor;';
                let siFormat = new SITSFormat(this.apiName, this.sysId, typeFormat, aliasFormat, globalAliasFormat, this.accessType, JSExportedTypes.cls, 0, this.typeDefs);
                SITSFormat.updateFlags(siFormat, this.currentSI, this.getInternalType());
                return siFormat;
            }
        }
        TSChecker.TSTypeExporter = TSTypeExporter;
        function generateTypedefDeclFromScopemap(typedefMap) {
            let content = '';
            for (let scopeName in typedefMap) {
                let result = generateTypedefDeclFromScopeName(typedefMap[scopeName], scopeName);
                if (result.decl.length > 0)
                    content += '\n' + result.decl + '\n';
            }
            return content;
        }
        TSChecker.generateTypedefDeclFromScopemap = generateTypedefDeclFromScopemap;
        var thisSITypedefMap = {};
        function addToThisSITypedefMap(qualifiedName) {
            thisSITypedefMap[qualifiedName] = true;
        }
        TSChecker.addToThisSITypedefMap = addToThisSITypedefMap;
        function clearThisSITypedefMap() {
            thisSITypedefMap = {};
        }
        TSChecker.clearThisSITypedefMap = clearThisSITypedefMap;
        var typedefMap = {};
        function addToTypeDefMap(qualifiedName) {
            typedefMap[qualifiedName] = true;
        }
        TSChecker.addToTypeDefMap = addToTypeDefMap;
        function isTypedefType(qualifiedName) {
            return !!(typedefMap[qualifiedName] || thisSITypedefMap[qualifiedName]);
        }
        TSChecker.isTypedefType = isTypedefType;
        function generateTypedefDeclFromScopeName(snTypeDefs, scopeName) {
            var result = {
                decl: ''
            };
            if (!Array.isArray(snTypeDefs))
                return result;
            var snTypedefsNS = {};
            var rootTypes = '';
            for (let i = 0; i < snTypeDefs.length; i++) {
                for (let j = 0; j < snTypeDefs[i].length; j++) {
                    let def = snTypeDefs[i][j];
                    if (!def.name)
                        continue;
                    var subModules = def.name.split('.');
                    let typeFormat = '';
                    var typeName = subModules.splice(subModules.length - 1, 1)[0];
                    let trimmedType = def.type.trim();
                    if (trimmedType.startsWith('{')) {
                        if (trimmedType.endsWith('[]'))
                            typeFormat = `type ${typeName} = ${trimmedType}; \n\n`;
                        else
                            typeFormat = 'interface ' + typeName + ' ' + trimmedType + '\n\n';
                    }
                    else { //test_6002.txt
                        //typeFormat = `type ${typeName} = ${def.type} \n\n`;
                        typeFormat = `interface ${typeName} extends ${trimmedType} {}\n`;
                    }
                    addToTypeDefMap(scopeName + '.' + typeName);
                    //if(subModules.length > 1)
                    //	subModules.splice(0, 1);
                    var rootModule = snTypedefsNS;
                    for (var k = 0; k < subModules.length; k++) {
                        rootModule[subModules[k]] = rootModule[subModules[k]] || {};
                        if (typeof rootModule[subModules[k]] == 'string') {
                            console.log('module is defined as type overriding the type with modue ');
                            rootModule[subModules[k]] = {};
                        }
                        rootModule = rootModule[subModules[k]];
                    }
                    rootModule[typeName] = typeFormat;
                }
            }
            function getAllAccumulated(obj) {
                var str = '';
                for (var prop in obj) {
                    if (typeof obj[prop] == 'object') {
                        let val = getAllAccumulated(obj[prop]);
                        str += 'namespace ' + prop + ' {\n' + val + '\n}\n';
                    }
                    else if (typeof obj[prop] == 'string') {
                        str += obj[prop];
                    }
                }
                return str;
            }
            var str = getAllAccumulated(snTypedefsNS);
            if (str.length == 0)
                return result;
            //str = 'declare namespace sn {\n' + str + '}';
            str = `declare namespace ${scopeName} {
			${str}
		}`;
            result.decl = str;
            //console.log(str);
            return result;
        }
        TSChecker.generateTypedefDeclFromScopeName = generateTypedefDeclFromScopeName;
        function generateTypedefDecl(snTypeDefs) {
            if (!Array.isArray(snTypeDefs))
                return '';
            var snTypedefsNS = {};
            var rootTypes = '';
            for (let i = 0; i < snTypeDefs.length; i++) {
                for (let j = 0; j < snTypeDefs[i].length; j++) {
                    let def = snTypeDefs[i][j];
                    if (!def.name)
                        continue;
                    var subModules = def.name.split('.');
                    let typeFormat = 'interface ' + subModules[subModules.length - 1] + ' ' + def.type + '\n\n';
                    if (subModules.length > 1)
                        subModules.splice(0, 1);
                    var typeName = subModules.splice(subModules.length - 1, 1)[0];
                    var rootModule = snTypedefsNS;
                    for (var k = 0; k < subModules.length; k++) {
                        rootModule[subModules[k]] = rootModule[subModules[k]] || {};
                        if (typeof rootModule[subModules[k]] == 'string') {
                            console.log('module is defined as type overriding the type with modue ');
                            rootModule[subModules[k]] = {};
                        }
                        rootModule = rootModule[subModules[k]];
                    }
                    rootModule[typeName] = typeFormat;
                }
            }
            function getAllAccumulated(obj) {
                var str = '';
                for (var prop in obj) {
                    if (typeof obj[prop] == 'object') {
                        let val = getAllAccumulated(obj[prop]);
                        str += 'namespace ' + prop + ' {\n' + val + '\n}\n';
                    }
                    else if (typeof obj[prop] == 'string') {
                        str += obj[prop];
                    }
                }
                return str;
            }
            var str = getAllAccumulated(snTypedefsNS);
            str = 'declare namespace sn {\n' + str + '}';
            console.log(str);
            return str;
        }
        TSChecker.generateTypedefDecl = generateTypedefDecl;
        function getTypeDefsAsScopeMap(siJSData, currentSysId = "-1") {
            var snTypeDefs = {};
            for (let scopeName in siJSData) {
                if (!snTypeDefs[scopeName])
                    snTypeDefs[scopeName] = [];
                for (let i = 0; i < siJSData[scopeName].length; i++) {
                    if ((Array.isArray(siJSData[scopeName][i].td)) && siJSData[scopeName][i].id != currentSysId) {
                        snTypeDefs[scopeName].push(siJSData[scopeName][i].td);
                    }
                }
            }
            return snTypeDefs;
        }
        TSChecker.getTypeDefsAsScopeMap = getTypeDefsAsScopeMap;
        function getTypeDefs(siJSData, currentSysId = "-1") {
            var snTypeDefs = [];
            for (let scopeName in siJSData) {
                for (let i = 0; i < siJSData[scopeName].length; i++) {
                    if ((Array.isArray(siJSData[scopeName][i].td)) && siJSData[scopeName][i].id != currentSysId) {
                        snTypeDefs.push(siJSData[scopeName][i].td);
                    }
                }
            }
            return snTypeDefs;
        }
        TSChecker.getTypeDefs = getTypeDefs;
        function getTypeFromDisplayParts(parts, node) {
            /* function getMe() {
                var ob = {};
                var x = {
                    name: "hello",
                    age: '28'
                };
                var y = {
                    a: {
                        test: function (k, z) {
                            if (typeof k == 'string') {
                                this.sk = k;
                                this.z = z;
                                return this;
                            } else {
                                return "hllo yln";
                            }
                        },
                        another: {
                            test: function () {
                            }
                        }
                    },
                    init: function () {
                        return sn_change_cab.CABRuntimeStateSNC();
                    },
                    setup: function () {
                        return new Notification();
                    }
                }
                ob.x = x;
                ob.y = y;
                return ob;
            }
            */
            // filter out all "localNames" from above function
            var skipCount = 0;
            var afterLocalNames = [];
            // TEST: test_1000
            var objDepthCounter = 0;
            for (let i = 0; i < parts.length; i++) {
                // if (parts[i].kind == 'punctuation' && parts[i].text == ':') {
                // 	if (afterLocalNames.length > 3) {
                // 		let index = afterLocalNames.length;
                // 		if (afterLocalNames[index - 1].kind == 'propertyName') {
                // 			if (afterLocalNames[index - 2].kind == 'punctuation') {
                // 				if (afterLocalNames[index - 3].kind == 'localName') {
                // 					var removedOnes = afterLocalNames.splice(afterLocalNames.length - 3, 2);
                // 					console.log(JSON.stringify(removedOnes));
                // 				}
                // 			}
                // 		}
                // 	}
                // }
                //TEST: test_1000, test_1006
                afterLocalNames.push(parts[i]);
                if (parts[i].kind == 'punctuation') {
                    if (parts[i].text == '{') {
                        objDepthCounter++;
                        continue;
                    }
                    if (parts[i].text == '}') {
                        objDepthCounter--;
                        continue;
                    }
                    if (objDepthCounter == 0)
                        continue;
                    if (!(parts[i].text == ':' || parts[i].text == '(' || parts[i].text == '<'))
                        continue;
                    if (parts[i].text == '<') {
                        if (i < 1)
                            continue;
                        if (parts[i - 1].kind != 'methodName')
                            continue;
                    }
                    let index = afterLocalNames.length - 2;
                    while (index > 1) {
                        let kind = afterLocalNames[index].kind;
                        let text = afterLocalNames[index].text;
                        if (!((kind == 'punctuation' && text == '.') || kind == 'propertyName' || kind == 'localName' || kind == 'methodName')) {
                            index++;
                            break;
                        }
                        index--;
                    }
                    let rmNodes = afterLocalNames.splice(index, ((afterLocalNames.length - index) - 2));
                    //console.log(JSON.stringify(rmNodes));
                }
            }
            skipCount = 0;
            // remove any functions which are mutating the 'this" types and return "this";
            //TEST: test_1001
            var finalParts = afterLocalNames.filter((part, index, ar) => {
                if (skipCount > 0) {
                    skipCount--;
                    return false;
                }
                if (part.kind == 'keyword' && part.text == 'typeof') {
                    skipCount = 2;
                    part.text = 'any';
                }
                else if (part.kind == 'functionName') { // TEST: test_1002
                    part.text = 'Function';
                }
                return true;
            });
            var finalType = { kind: 'type', text: '' };
            finalType = finalParts.reduce((previosValue, part) => {
                if (node && (ts.isObjectLiteralElementLike(node) || ts.isObjectLiteralExpression(node))) {
                    let text = part.text;
                    if (part.kind === "stringLiteral" && !/^[a-z0-9]+$/.test(text) && !/^("|')/.test(text))
                        text = `"${text}"`;
                    previosValue.text += text;
                }
                else
                    previosValue.text += part.text;
                return previosValue;
            }, { text: '', kind: 'type' });
            if (finalType.text.endsWith('...')) {
                //console.log('big problem');
                return 'any';
            }
            return finalType.text;
        }
        function parseSIWithTypeChecker(currentSI, exportedTypeName, rootNode, checker) {
            clearThisSITypedefMap();
            var sourceRootNode = rootNode;
            let simpleName = '';
            let scopeName = '';
            let tokens = exportedTypeName.split('.');
            if (tokens.length == 1)
                simpleName = exportedTypeName;
            else {
                simpleName = tokens[1];
                scopeName = tokens[0];
            }
            var typeExporter = new TSTypeExporter(currentSI, exportedTypeName, '', "12345");
            /** Serialize a symbol into a json object */
            function serializeSymbol(symbol) {
                return {
                    isOptional: false,
                    name: symbol.getName(),
                    documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
                    type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration), void 0, ts.TypeFormatFlags.UseFullyQualifiedType)
                };
            }
            /** Serialize a signature (call or construct) */
            function serializeSignature(signature, noReturnType = false) {
                var typeParameters = signature.getTypeParameters();
                var typeParms = [];
                if (typeParameters != void 0) {
                    //console.log(typeParameters.length + '');
                    typeParameters.forEach(typeParm => {
                        let symbol = typeParm.getSymbol();
                        if (symbol) {
                            typeParms.push(symbol.getName());
                            //console.log(symbol.getEscapedName() + '');
                        }
                        else {
                            //console.log('symbol error on type parameters')
                        }
                    });
                }
                var rFlags = ts.TypeFormatFlags.UseFullyQualifiedType;
                rFlags |= ts.TypeFormatFlags.WriteArrayAsGenericType;
                //rFlags |= ts.TypeFormatFlags.WriteTypeArgumentsOfSignature;
                rFlags |= ts.TypeFormatFlags.NoTruncation;
                //let returnType = checker.typeToString(signature.getReturnType(), rootNode, rFlags);
                //let returnType1 = checker.typeToString(signature.getReturnType(), rootNode, 0);
                //checker.getTypeAtLocation(signature.getReturnType());
                // FIXME: somehow this is working for now. do some R&D on this flag.
                //rFlags = 0;
                let returnType1 = '';
                //FIXME: test_self_return_crash.txt
                if (!noReturnType) {
                    //let returnType2: Array<{ text: string, kind: string }> = ts.typeToDisplayParts(checker, signature.getReturnType(), void 0, rFlags /* InTypeAlias */);
                    let returnType2 = typeToDisplayParts(checker, signature.getReturnType(), void 0, rFlags);
                    returnType1 = getTypeFromDisplayParts(returnType2);
                }
                // var str = '';
                // var isFnNameKind = false;
                // returnType2.map(val => {
                // 	str += val.text;
                // 	if (val.kind == 'functionName')
                // 		isFnNameKind = true;
                // });
                // if (isFnNameKind)
                // 	returnType1 = 'any';
                //console.log(returnType + '\n' + returnType1 + '\n' + str);
                var doc = ts.displayPartsToString(signature.getDocumentationComment(checker));
                var lineInfo = {
                    line: 0,
                    character: 0
                };
                if (doc.length > 0)
                    lineInfo.doc = doc;
                return {
                    lineInfo: lineInfo,
                    parameters: signature.parameters.map(serializeSymbol),
                    returnType: returnType1,
                    documentation: doc,
                    typeParams: typeParms
                };
            }
            function getLineInfo(node) {
                var lineAndChar = sourceRootNode.getLineAndCharacterOfPosition(node.pos);
                lineAndChar.line += 1;
                lineAndChar.character += 1;
                return {
                    line: lineAndChar.line,
                    character: lineAndChar.character,
                };
            }
            function getFunctionExpressionType(node) {
                var lineInfo = getLineInfo(node);
                function hasThisReturnType() {
                    return node.body.getText().indexOf('return this;') != -1 || !currentSI.parseReturnType;
                }
                var retArray = [];
                function visitRetStatements(localNode) {
                    //console.log(ts.SyntaxKind[localNode.kind]);
                    if (ts.isFunctionExpression(localNode) || ts.isFunctionDeclaration(localNode))
                        return;
                    if (ts.isReturnStatement(localNode)) {
                        if (localNode.getChildCount() != 3)
                            return;
                        let actualExpression = localNode.getChildAt(1);
                        // TODO: fix in next version.
                        if (ts.isObjectLiteralExpression(actualExpression)) {
                            let objResult = getTypeFromObjectLiteralExpression(actualExpression);
                            let obLit = new ObjectLiteraltype("temp");
                            obLit.setKeysType(objResult);
                            let r2 = obLit.toTypeFormat();
                            //console.log(r2);
                            if (retArray.indexOf(r2) == -1)
                                retArray.push(r2);
                            return;
                        }
                        let isFunExp = false;
                        if (ts.isFunctionExpression(actualExpression))
                            isFunExp = true;
                        //console.log('Actual expression ' + actualExpression.getText());
                        if (actualExpression.getText() == 'this') {
                            retArray.push('this');
                            return;
                        }
                        let actualType = checker.getTypeAtLocation(actualExpression);
                        let flags = ts.TypeFormatFlags.UseTypeOfFunction | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                        let retDisplayParts = typeToDisplayParts(checker, actualType, void 0, flags /* InTypeAlias */);
                        let retStr = getTypeFromDisplayParts(retDisplayParts);
                        if (retStr == 'any')
                            return;
                        if (retArray.indexOf(retStr) >= 0)
                            return;
                        //FIXME: stupid bug if arrow function comes into middle , it is becoming invalid type
                        //TEST: test_member_this.txt
                        if (isFunExp)
                            retArray.unshift(retStr);
                        else
                            retArray.push(retStr);
                        return;
                    }
                    localNode.forEachChild(visitRetStatements);
                    //ts.forEachChild(localNode, visitRetStatements);
                }
                // FIXME: unless microsoft fixes 'this' () return type we can't use it.
                // use jsDoc inStead.
                var r = checker.getTypeAtLocation(node).getCallSignatures().map((signature) => {
                    return serializeSignature(signature, hasThisReturnType());
                });
                var typedefReturnType = getReturnTypeFromTypeDefs(node);
                if (typedefReturnType.length > 0)
                    r[0].returnType = typedefReturnType;
                r[0].lineInfo = lineInfo;
                if (hasThisReturnType())
                    r[0].returnType = 'this';
                if (r[0].parameters.length > node.parameters.length)
                    r[0].parameters.splice(r[0].parameters.length - 1, 1); // test_9020.txt
                if (node.parameters.length > 0) {
                    let i = 0;
                    node.parameters.forEach(par => {
                        //let parType = ts.typeToDisplayParts(checker, checker.getTypeAtLocation(par), rootNode, 8388608 /* InTypeAlias */);
                        r[0].parameters[i++].isOptional = checker.isOptionalParameter(par);
                    });
                }
                let jsDocReturnTagNode = ts.getJSDocReturnTag(node);
                var returnType = r[0].returnType;
                if (returnType == 'Function' || returnType == 'any') {
                    try {
                        visitRetStatements(node.body);
                        var calcRetType = retArray.join('|');
                        //console.log('calc return: ' + calcRetType);
                        if (returnType == 'Function') // test_1010.txt
                            r[0].returnType = calcRetType.length > 0 ? calcRetType : 'void';
                    }
                    catch (ex) {
                        console.log('Return type parsing error ' + ex);
                    }
                }
                else if (returnType == 'boolean') {
                    if (jsDocReturnTagNode) {
                        let jsDocRetTypeNode = ts.getJSDocReturnType(node);
                        if (jsDocRetTypeNode) {
                            var tokens = jsDocRetTypeNode.getText().split(' ');
                            if (tokens.length == 3 && tokens[1] == 'is') {
                                let flags = ts.TypeFormatFlags.UseTypeOfFunction | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                                //getTypeFromDisplayParts()
                                let retDisplayParts = typeToDisplayParts(checker, checker.getTypeAtLocation(node), void 0, flags);
                                let displayTypes = getTypeFromDisplayParts(retDisplayParts);
                                let jsDocRetText = jsDocRetTypeNode.getText();
                                if (displayTypes.endsWith(jsDocRetText)) {
                                    r[0].returnType = jsDocRetText;
                                }
                            }
                        }
                    }
                }
                return r;
            }
            var isTypeFound = false;
            var siType;
            var typeDefObj = {};
            function parseJSDocTypes(sourceFile) {
                function visit(node) {
                    if (!node)
                        return;
                    //console.log(ts.SyntaxKind[node.kind]);
                    if (ts.isJSDocTypedefTag(node)) {
                        var tagIdentifier = ts.getNameOfJSDocTypedef(node);
                        console.log(tagIdentifier.getText());
                        let children = node.getChildren();
                        let moduleNode = children.find(ts.isModuleDeclaration);
                        if (!moduleNode)
                            return;
                        if (children.length >= 2) {
                            let typeDefName = moduleNode.getText();
                            var tokens = typeDefName.split('.');
                            if (tokens.length < 2) {
                                console.warn("typedef should start with 'sn' namespace");
                                return;
                            }
                            if (tokens[0] != 'sn') {
                                console.warn("typedef should start with 'sn' namespace");
                                return;
                            }
                            typeDefObj[typeDefName] = true;
                            //console.warn('defined new typedef Type = ' + typeDefName);
                        }
                    }
                    else if (ts.isTypeReferenceNode(node)) {
                        var friendlyName = node.getFullText();
                        //console.log('reference ' + friendlyName);
                        if (!typeDefObj[friendlyName])
                            return;
                        let typeChildren = node.typeName.getChildren();
                        if (typeChildren.length == 0) {
                            console.log('type children must exists ' + node.getFullText());
                            return;
                        }
                        let thisSymbol = checker.getSymbolAtLocation(typeChildren[typeChildren.length - 1]);
                        if (!thisSymbol)
                            return;
                        var result = typeToDisplayParts(checker, checker.getDeclaredTypeOfSymbol(thisSymbol), void 0, 8388608 /* InTypeAlias */);
                        //var typeStr = 'type ' + node.getFullText() + " = ";
                        var typeStr = getTypeFromDisplayParts(result);
                        //let typeName = node.getFullText();
                        //typeDefObj[typeName] = { type: typeStr, kind: 'typedef', name: typeName };
                        typeExporter.addTypedefData({ type: typeStr, kind: JSDocTypes.typeDefs, name: friendlyName });
                        //console.log('reference nodes');
                    }
                    var children = node.getChildren();
                    if (children.length > 0)
                        children.forEach(val => visit(val));
                }
                visit(sourceFile);
            }
            parseJSDocTypes(rootNode);
            // Object.keys(typeDefObj).forEach(key => {
            // 	typeExporter.addTypedefData(typeDefObj[key]);
            // });
            function getThisInitializer(node) {
                var fields = [];
                let blockNode = node.getChildren(rootNode).find(ts.isBlock);
                if (!blockNode)
                    return fields;
                let syntaxList = blockNode.getChildren().find(val => {
                    return val.kind == ts.SyntaxKind.SyntaxList;
                });
                if (!syntaxList)
                    return fields;
                let expressionStatements = syntaxList.getChildren(rootNode).filter(ts.isExpressionStatement);
                expressionStatements.forEach(item => {
                    let lineInfo = getLineInfo(item);
                    let binItem = item.getChildren(rootNode).find(ts.isBinaryExpression);
                    if (!binItem)
                        return fields;
                    let binChildren = binItem.getChildren();
                    let propAccessNode = binChildren.find(ts.isPropertyAccessExpression);
                    if (!propAccessNode)
                        return fields;
                    let propChildren = propAccessNode.getChildren();
                    if (propChildren[0].kind != ts.SyntaxKind.ThisKeyword)
                        return fields;
                    //let firstNode = propChildren[0];
                    let lastNode = propChildren[propChildren.length - 1];
                    let propName = lastNode.getText();
                    let flags = ts.TypeFormatFlags.UseTypeOfFunction | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                    let binLastNode = binChildren[binChildren.length - 1];
                    lineInfo = getLineInfo(binLastNode);
                    var propType = '';
                    if (ts.isNumericLiteral(binLastNode)) {
                        propType = 'number';
                    }
                    else if (ts.isStringLiteral(binLastNode)) {
                        propType = 'string';
                    }
                    else if (ts.isLiteralTypeNode(binLastNode)) {
                        propType = 'number';
                    }
                    else if (ts.SyntaxKind.FalseKeyword == binLastNode.kind || ts.SyntaxKind.TrueKeyword == binLastNode.kind) {
                        propType = 'boolean';
                    }
                    else if (ts.SyntaxKind.FirstLiteralToken == binLastNode.kind) {
                        propType = 'number';
                    }
                    // } else if (ts.isCallExpression(binLastNode)) {
                    // 	propType = checker.typeToString(checker.getTypeAtLocation(binLastNode), rootNode, 0);
                    // }
                    else {
                        propType = checker.typeToString(checker.getTypeAtLocation(binLastNode), rootNode, 0);
                        let displayParts = typeToDisplayParts(checker, checker.getTypeAtLocation(binLastNode), void 0, ts.TypeFormatFlags.UseFullyQualifiedType);
                        let newPropType = getTypeFromDisplayParts(displayParts, binLastNode);
                        if (propType != newPropType)
                            propType = newPropType;
                        if (propType == 'Function')
                            propType = 'any';
                    }
                    //var fnNode = ts.isFunctionExpression(binLastNode);
                    var isFunction = false;
                    try {
                        var fnParts = tryGetFunctionPartsFromString(propType);
                        isFunction = true;
                        fields.push(new RawFunctionType(propName, fnParts.paramBody, fnParts.returnType, fnParts.template).setLineInfo(lineInfo));
                    }
                    catch (e) {
                    }
                    if (!isFunction)
                        fields.push(new StringType(propName, propType).setLineInfo(lineInfo).setLineInfo(lineInfo));
                });
                return fields;
            }
            function getTypeFromObjectLiteralExpression(node, tryThisAssignments = false) {
                var propertyTypes = {};
                node.properties.forEach(propNode => {
                    var propName = propNode.name.getText();
                    var propChilds = propNode.getChildren();
                    var idNode = propChilds.find(ts.isIdentifier);
                    //var lineInfo = getLineInfo(propNode);
                    // if (idNode) {
                    // 	console.log(idNode + '');
                    // }
                    var fnNode = propChilds.find(ts.isFunctionExpression);
                    if (tryThisAssignments && fnNode && propName == 'initialize') {
                        let thisOverrides = getThisInitializer(fnNode);
                        thisOverrides.forEach(val => {
                            propertyTypes[val.name] = val;
                        });
                    }
                    // if (fnNode) {
                    // 	let result = getFunctionExpressionType(fnNode);
                    // 	console.log(JSON.stringify(result));
                    // }
                    let lastChild = propChilds[propChilds.length - 1];
                    var propType = '';
                    let isStringLiteral = ts.isStringLiteral(propChilds[0]);
                    let propLineInfo = getLineInfo(lastChild);
                    if (ts.isNumericLiteral(lastChild)) {
                        propertyTypes[propName] = new NumericLiteralType(propName, 'number').setLineInfo(propLineInfo);
                    }
                    else if (ts.isStringLiteral(lastChild)) {
                        propertyTypes[propName] = new StringLiteralType(propName, 'string').setLineInfo(propLineInfo);
                    }
                    else {
                        if (fnNode) {
                            let result = getFunctionExpressionType(fnNode);
                            // TEST: test_1002
                            //if (propName == result[0].returnType)
                            // 	result[0].returnType = 'any'; // mostly mutated the "this" expression in function body.
                            let fnType = FunctionType.create(propName, result[0]);
                            propertyTypes[propName] = fnType;
                        }
                        else {
                            let flags = ts.TypeFormatFlags.UseTypeOfFunction | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                            propType = checker.typeToString(checker.getTypeAtLocation(lastChild), void 0, flags);
                            let propType1 = checker.typeToString(checker.getTypeAtLocation(propNode), rootNode, flags);
                            if (propType != propType1) {
                                console.log('different types found, overriding default one');
                                propType = propType1;
                            }
                            let finalTypeParts = typeToDisplayParts(checker, checker.getTypeAtLocation(propNode), void 0, flags /* InTypeAlias */);
                            // if (propType.indexOf('typeof') >= 0)
                            // 	propType = 'any';
                            propType = getTypeFromDisplayParts(finalTypeParts, propNode);
                            let isFunctionType = false;
                            try {
                                let result = tryGetFunctionPartsFromString(propType);
                                propertyTypes[propName] = new RawFunctionType(propName, result.paramBody, result.returnType, result.template);
                                isFunctionType = true;
                                //console.log(JSON.stringify(result));
                            }
                            catch (e) {
                                //console.log(e);
                            }
                            if (!isFunctionType)
                                propertyTypes[propName] = new StringType(propName, propType);
                        }
                    }
                    if (isStringLiteral)
                        propertyTypes[propName].setAsElement();
                    propertyTypes[propName].setLineInfo(propLineInfo);
                });
                return propertyTypes;
            }
            function getObjectLiteralExpression(node) {
                var result = typeToDisplayParts(checker, checker.getTypeAtLocation(node), void 0, 8388608 | ts.TypeFormatFlags.NoTruncation /* InTypeAlias */);
                return getTypeFromDisplayParts(result);
            }
            function addToDefaultType(propertyName, thisNode, doc) {
                var lineInfo = getLineInfo(thisNode);
                //TODO: check the below flags test_9020.txt
                //let flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                let flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.MultilineObjectLiterals;
                let propType = checker.typeToString(checker.getTypeAtLocation(thisNode), void 0, flags);
                let isFunctionType = false;
                try {
                    let result = tryGetFunctionPartsFromString(propType);
                    isFunctionType = true;
                    if (propertyName == simpleName) {
                        typeExporter.addConstructorFunction(new RawFunctionType(propertyName, result.paramBody, result.returnType, result.template).setLineInfo(lineInfo));
                        typeExporter.setAsFunction();
                    }
                    else
                        typeExporter.addField(new RawFunctionType(propertyName, result.paramBody, result.returnType, result.template).setLineInfo(lineInfo));
                }
                catch (e) {
                    //console.log('unable to fetch th')
                }
                if (!isFunctionType)
                    typeExporter.addField(new StringType(propertyName, propType, doc).setLineInfo(lineInfo));
            }
            function getSyntaxListFromCallExpression(callNode) {
                let rNode;
                // let childCount = node.getChildCount();
                // if (!(childCount >= 1 && childCount <= 2))
                // 	return rNode;
                // let callNode = node.getChildAt(0);
                // if (!ts.isCallExpression(callNode))
                // 	return rNode;
                var parenthsizedNodes = callNode.getChildren().find(ts.isParenthesizedExpression);
                if (!parenthsizedNodes)
                    return rNode;
                var funcNodes = parenthsizedNodes.getChildren().find(ts.isFunctionExpression);
                if (!funcNodes)
                    return rNode;
                var blockNode = funcNodes.getChildren().find(ts.isBlock);
                if (!blockNode)
                    return rNode;
                let syntaxList = blockNode.getChildren().find(thisNode => thisNode.kind == ts.SyntaxKind.SyntaxList);
                return syntaxList;
            }
            function getStatementsFromIIFCallExpression(node) {
                var nodes = [];
                let childCount = node.getChildCount();
                if (!(childCount >= 1 && childCount <= 2))
                    return nodes;
                let callNode = node.getChildAt(0);
                if (!ts.isCallExpression(callNode))
                    return nodes;
                // var parenthsizedNodes = callNode.getChildren().find(ts.isParenthesizedExpression);
                // if (!parenthsizedNodes)
                // 	return nodes;
                // var funcNodes = parenthsizedNodes.getChildren().find(ts.isFunctionExpression);
                // if (!funcNodes)
                // 	return nodes;
                // var blockNode = funcNodes.getChildren().find(ts.isBlock);
                // if (!blockNode)
                // 	return nodes;
                // let syntaxList = blockNode.getChildren().find(thisNode => thisNode.kind == ts.SyntaxKind.SyntaxList);
                let syntaxList = getSyntaxListFromCallExpression(callNode);
                if (!syntaxList)
                    return nodes;
                return syntaxList.getChildren();
            }
            var idToObjectNode = {};
            function parseCurrentStatementTypeDefs_old(node) {
                let typedefTags = ts.getJSDocTags(node).filter(ts.isJSDocTypedefTag);
                typedefTags.forEach(tag => {
                    let childs = tag.getChildren();
                    var typeDefIdNode = ts.getNameOfJSDocTypedef(tag);
                    console.log(typeDefIdNode.getText());
                    if (childs.length != 3)
                        return;
                    let moduleNode = childs.find(ts.isModuleDeclaration);
                    if (moduleNode) {
                        if (!typeDefObj[moduleNode.getText()])
                            console.warn("seems like module declared  but not used in where discarding: " + moduleNode.getText());
                        return;
                    }
                    let idNodes = childs.filter(ts.isIdentifier);
                    //let nameNode = childs.filter(ts.isIdentifier);
                    if (idNodes.length != 2)
                        return;
                    let typeNode = idNodes[1];
                    let thisSymbol = checker.getSymbolAtLocation(typeNode);
                    if (!thisSymbol)
                        return;
                    //let parts = typeToDisplayParts(checker, checker.getDeclaredTypeOfSymbol(thisSymbol), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.InTypeAlias);
                    let parts = typeToDisplayParts(checker, checker.getDeclaredTypeOfSymbol(thisSymbol), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
                    let thisType = getTypeFromDisplayParts(parts);
                    let typeName = typeNode.getText().trim();
                    if (thisType == 'any') {
                        let declaredType = checker.getDeclaredTypeOfSymbol(thisSymbol);
                        let props = declaredType.getProperties();
                        props.forEach(prop => {
                            let propTypeStr = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration));
                            console.log('prop ' + propTypeStr);
                        });
                    }
                    if (thisType != 'any')
                        typeExporter.addTypedefData({ type: thisType, kind: JSDocTypes.typeDefs, name: typeName });
                    else
                        console.warn('typede came as any ' + typeName);
                    // else
                    // 	console.warn('typedef name should starts with "sn" namespace e.g sn.conf.InputData else it will be treated as private to this script include');
                    // //console.log(`interface ${typeName} ${thisType}`);
                    //typeDefObj[idNodes[0].getText().trim()] = {}
                });
            }
            function parseCurrentStatementTypeDefs(node) {
                //return parseCurrentStatementTypeDefs_old(node);
                let typedefTags = ts.getJSDocTags(node).filter(ts.isJSDocTypedefTag);
                typedefTags.forEach(tag => {
                    let childs = tag.getChildren();
                    var typeDefIdNode = ts.getNameOfJSDocTypedef(tag);
                    console.log(typeDefIdNode.getText());
                    if (childs.length != 3)
                        return;
                    let moduleNode = childs.find(ts.isModuleDeclaration);
                    if (moduleNode) {
                        if (!typeDefObj[moduleNode.getText()]) {
                            var propChilds = childs[2].getChildren();
                            propChilds.forEach((prop) => {
                                let propTypeNode = checker.getTypeAtLocation(prop);
                                var parts = typeToDisplayParts(checker, propTypeNode, rootNode, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
                                //console.log(displayPartsToString(parts));
                                console.log(getTypeFromDisplayParts(parts));
                            });
                            //console.warn("seems like module declared  but not used in where discarding: " + moduleNode.getText());
                        }
                        //return;
                    }
                    //let idNodes = childs.filter(ts.isIdentifier);
                    //let nameNode = childs.filter(ts.isIdentifier);
                    // if (idNodes.length != 2)
                    // 	return;
                    let typeNode = childs[2];
                    let thisType = 'any';
                    let typeName = typeNode.getText().trim();
                    let qualifiedTypeName = typeName;
                    if (!moduleNode) {
                        let thisSymbol = checker.getSymbolAtLocation(typeNode);
                        if (!thisSymbol)
                            return;
                        //let parts = typeToDisplayParts(checker, checker.getDeclaredTypeOfSymbol(thisSymbol), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.InTypeAlias);
                        let parts = typeToDisplayParts(checker, checker.getDeclaredTypeOfSymbol(thisSymbol), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
                        thisType = getTypeFromDisplayParts(parts);
                        if (thisType == 'any') {
                            let typeStr = '';
                            let declaredType = checker.getDeclaredTypeOfSymbol(thisSymbol);
                            let props = declaredType.getProperties();
                            declaredType.getApparentProperties();
                            props.forEach(prop => {
                                let propTypeStr = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
                                let fnSign = '';
                                try {
                                    let fnParts = tryGetFunctionPartsFromString(propTypeStr);
                                    fnSign = fnParts.template + fnParts.paramBody + ': ' + fnParts.returnType;
                                }
                                catch (e) {
                                }
                                //console.log(prop.getEscapedName() + ': ' + propTypeStr);
                                if (fnSign.length > 0)
                                    typeStr += `${prop.getEscapedName()}${fnSign},\n`;
                                else
                                    typeStr += `${prop.getEscapedName()}: ${propTypeStr},\n`;
                            });
                            //console.log(typeStr);
                            thisType = `{
								${typeStr}
							}`;
                        }
                    }
                    else {
                        let tokens = typeName.split('.');
                        tokens.shift();
                        typeName = tokens.join('.');
                        if (childs[1].getChildCount() < 1)
                            return;
                        let typeNode = checker.getTypeAtLocation(childs[1].getChildren()[1]);
                        var parts = typeToDisplayParts(checker, typeNode, void 0, void 0);
                        //var parts = ts.typeToDisplayParts(checker, typeNode, void 0, void 0);
                        thisType = getTypeFromDisplayParts(parts);
                        if (thisType == 'any') {
                            let typeStr = '';
                            let propChilds = [];
                            try {
                                propChilds = childs[1].getChildren()[1].getChildAt(1).getChildren();
                            }
                            catch (e) {
                                console.log('typedef parsing error');
                            }
                            propChilds.forEach((propChild) => {
                                let idNode = propChild.getChildren().find(ts.isIdentifier);
                                if (idNode == null)
                                    return;
                                //let parts = ts.typeToDisplayParts(checker, checker.getTypeAtLocation(propChild), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
                                let parts = typeToDisplayParts(checker, checker.getTypeAtLocation(propChild), void 0, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
                                let propType = getTypeFromDisplayParts(parts);
                                let fnSign = '';
                                try {
                                    let fnParts = tryGetFunctionPartsFromString(propType);
                                    fnSign = `${fnParts.template}${fnParts.paramBody}: ${fnParts.returnType}`;
                                }
                                catch (e) {
                                }
                                if (fnSign.length > 0)
                                    typeStr += `${idNode.getText()}${fnSign},\n`;
                                else
                                    typeStr += `${idNode.getText()}: ${propType},\n`;
                            });
                            typeStr = `{${typeStr}}`;
                            thisType = typeStr;
                            //ts.typeToDisplayParts(checker, checker.getTypeAtLocation(p5[1]), void 0, void 0);
                        }
                    }
                    if (thisType != 'any') {
                        addToThisSITypedefMap(qualifiedTypeName);
                        typeExporter.addTypedefData({ type: thisType, kind: JSDocTypes.typeDefs, name: typeName });
                    }
                    else
                        console.warn('typedef came as any ' + typeName);
                    // else
                    // 	console.warn('typedef name should starts with "sn" namespace e.g sn.conf.InputData else it will be treated as private to this script include');
                    // //console.log(`interface ${typeName} ${thisType}`);
                    //typeDefObj[idNodes[0].getText().trim()] = {}
                });
            }
            function getReturnTypeFromTypeDefs(node) {
                var returnTag = ts.getJSDocReturnTag(node);
                if (!returnTag)
                    return '';
                var returnType = ts.getJSDocReturnType(node);
                if (!returnType)
                    return '';
                if (!isTypedefType(returnType.getText()))
                    return '';
                return returnType.getText();
            }
            function parseCurrentStatements(currentStatement, parseIIFs = true) {
                parseCurrentStatementTypeDefs(currentStatement);
                var lineInfo = getLineInfo(currentStatement);
                if (ts.isVariableStatement(currentStatement)) {
                    let declaration = currentStatement.declarationList.declarations[0];
                    let declChilds = declaration.getChildren(rootNode);
                    if (declChilds.length == 1) {
                        isTypeFound = declChilds[0].getText().trim() == simpleName;
                        return;
                    }
                    if (declChilds.length != 3)
                        return;
                    let firstChild = declChilds[0];
                    let thirdChild = declChilds[2];
                    if (ts.isObjectLiteralExpression(thirdChild))
                        idToObjectNode[firstChild.getText().trim()] = thirdChild;
                    if (isTypeFound)
                        return;
                    if (ts.isIdentifier(firstChild)) {
                        if (firstChild.getText().trim() != simpleName)
                            return;
                        if (ts.isCallExpression(thirdChild)) {
                            let fullText = thirdChild.getFullText().trim();
                            if (fullText == 'Class.create()') {
                                isTypeFound = true;
                                //test_9013;
                                typeExporter.setAsClass();
                                return;
                            }
                            else {
                                //test_9019.txt
                                var syntaxNode = getSyntaxListFromCallExpression(thirdChild);
                                if (syntaxNode) {
                                    syntaxNode.getChildren(rootNode).forEach(val => {
                                        parseCurrentStatements(val, false);
                                    });
                                }
                                else {
                                    //test_9014
                                    let thirdType = checker.getTypeAtLocation(thirdChild);
                                    let flags = ts.TypeFormatFlags.UseTypeOfFunction | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                                    let retDisplayParts = typeToDisplayParts(checker, thirdType, void 0, flags /* InTypeAlias */);
                                    var typeString = getTypeFromDisplayParts(retDisplayParts);
                                    if (typeString.startsWith('{') && typeString.endsWith('}')) {
                                        isTypeFound = true;
                                        typeExporter.addField(new RawStringObjectLiteralType(simpleName, typeString).setLineInfo(lineInfo));
                                        typeExporter.setAsObjectLiteral();
                                    }
                                    else {
                                        try {
                                            let ret = tryGetFunctionPartsFromString(typeString);
                                            //typeExporter.setAsFunction();
                                            //typeExporter.addField(new RawFunctionType(simpleName,ret.
                                        }
                                        catch (e) {
                                        }
                                    }
                                }
                            }
                        }
                        else if (ts.isObjectLiteralExpression(thirdChild)) {
                            isTypeFound = true;
                            //let r1 = getObjectLiteralExpression(thirdChild);
                            let keyTypes = getTypeFromObjectLiteralExpression(thirdChild);
                            let objType = new ObjectLiteraltype(simpleName);
                            objType.setLineInfo(lineInfo);
                            objType.setKeysType(keyTypes);
                            typeExporter.addField(objType);
                            typeExporter.setAsObjectLiteral();
                        }
                        else if (ts.isFunctionExpression(thirdChild)) {
                            isTypeFound = true;
                            typeExporter.setAsFunction();
                            let r = getFunctionExpressionType(thirdChild);
                            typeExporter.addConstructorFunction(FunctionType.create(simpleName, r[0]));
                            let fields = getThisInitializer(thirdChild);
                            if (fields.length > 0)
                                typeExporter.setAsClass();
                            fields.forEach(field => typeExporter.addField(field));
                        }
                        else if (ts.isIdentifier(thirdChild)) {
                            var nodeName = thirdChild.getText().trim();
                            if (!idToObjectNode[nodeName])
                                return;
                            isTypeFound = true;
                            let keyTypes = getTypeFromObjectLiteralExpression(idToObjectNode[nodeName]);
                            let objType = new ObjectLiteraltype(simpleName);
                            objType.setKeysType(keyTypes);
                            typeExporter.addField(objType);
                            typeExporter.setAsObjectLiteral();
                            //console.log(JSON.stringify(r));
                        }
                        else if (ts.isParenthesizedExpression(thirdChild)) {
                            //test_9015
                            let fnNodes = thirdChild.getChildren().filter(ts.isFunctionExpression);
                            if (fnNodes.length != 0) {
                                isTypeFound = true;
                                typeExporter.setAsFunction();
                                let r = getFunctionExpressionType(fnNodes[0]);
                                typeExporter.addConstructorFunction(FunctionType.create(simpleName, r[0]));
                            }
                            else {
                                if (rootNode.statements.length != 1)
                                    return;
                                let callNodes = thirdChild.getChildren().filter(ts.isCallExpression);
                                if (callNodes.length != 1)
                                    return;
                                var callExpression = callNodes.find(ts.isCallExpression);
                                if (!callExpression)
                                    return;
                                let fnExpression = callExpression.getChildren().find(ts.isFunctionExpression);
                                if (!fnExpression)
                                    return;
                                let blockExpression = fnExpression.getChildren().find(ts.isBlock);
                                if (!blockExpression)
                                    return;
                                let syntaxList = blockExpression.getChildren().find(thisNode => thisNode.kind == ts.SyntaxKind.SyntaxList);
                                if (!syntaxList)
                                    return;
                                syntaxList.getChildren().forEach(val => {
                                    parseCurrentStatements(val, false);
                                });
                            }
                        }
                    }
                    return;
                }
                else if (ts.isExpressionStatement(currentStatement)) {
                    if (!isTypeFound) {
                        let binaryEx = currentStatement.getChildren().find(ts.isBinaryExpression);
                        if (!binaryEx) {
                            let currChilds = currentStatement.getChildren();
                            if (currChilds.length != 2)
                                return;
                            if (!(ts.isIdentifier(currChilds[0]) && currChilds[1].kind == ts.SyntaxKind.SemicolonToken))
                                return;
                            isTypeFound = currChilds[0].getText().trim() == simpleName;
                            return;
                        }
                        let children = binaryEx.getChildren();
                        if (children.length != 3)
                            return;
                        let thirdNode = children[2];
                        let firstNode = children[0];
                        if (ts.isIdentifier(firstNode)) {
                            if (firstNode.getText().trim() == simpleName) {
                                if (ts.isCallExpression(thirdNode)) {
                                    let fullText = thirdNode.getFullText().trim();
                                    if (fullText == "Class.create()") {
                                        isTypeFound = true;
                                        typeExporter.setAsClass();
                                    }
                                }
                                else if (ts.isObjectLiteralExpression(thirdNode)) {
                                    isTypeFound = true;
                                    //getObjectLiteralExpression(thirdNode);
                                    //typeExporter.setAsObjectLiteral();
                                    let symbol = checker.getSymbolAtLocation(thirdNode);
                                    let doc;
                                    if (symbol)
                                        doc = ts.displayPartsToString(symbol.getDocumentationComment(checker));
                                    let objType = new ObjectLiteraltype(simpleName, doc);
                                    objType.setLineInfo(getLineInfo(thirdNode));
                                    let result = getTypeFromObjectLiteralExpression(thirdNode);
                                    objType.setKeysType(result);
                                    typeExporter.addField(objType);
                                    typeExporter.setAsObjectLiteral();
                                }
                                else if (ts.isFunctionExpression(thirdNode)) {
                                    isTypeFound = true;
                                    let r = getFunctionExpressionType(thirdNode);
                                    typeExporter.setAsFunction();
                                    typeExporter.addConstructorFunction(FunctionType.create(firstNode.getText(), r[0]));
                                    let fields = getThisInitializer(thirdNode);
                                    if (fields.length > 0)
                                        typeExporter.setAsClass();
                                    fields.forEach(field => typeExporter.addField(field));
                                }
                                else if (ts.isIdentifier(thirdNode)) {
                                    let nodeName = thirdNode.getText().trim();
                                    if (!idToObjectNode[nodeName])
                                        return;
                                    isTypeFound = true;
                                    let keyTypes = getTypeFromObjectLiteralExpression(idToObjectNode[nodeName]);
                                    let objType = new ObjectLiteraltype(simpleName);
                                    objType.setLineInfo(getLineInfo(thirdNode));
                                    objType.setKeysType(keyTypes);
                                    typeExporter.setAsObjectLiteral();
                                    typeExporter.addField(objType);
                                }
                            }
                            else {
                                if (ts.isObjectLiteralExpression(thirdNode))
                                    idToObjectNode[firstNode.getText().trim()] = thirdNode;
                            }
                        }
                        return;
                    }
                    let children = currentStatement.getChildren();
                    if (children.length >= 1 && children.length <= 2 && parseIIFs) {
                        if (ts.isCallExpression(children[0])) {
                            let iifNodes = getStatementsFromIIFCallExpression(currentStatement);
                            iifNodes.forEach((iifNode => {
                                parseCurrentStatements(iifNode, false);
                            }));
                        }
                    }
                    let binaryExpression = children.find(ts.isBinaryExpression);
                    if (!binaryExpression)
                        return;
                    let binChildren = binaryExpression.getChildren();
                    if (binChildren.length != 3)
                        return;
                    if (ts.isObjectLiteralExpression(binChildren[2]))
                        idToObjectNode[binChildren[0].getText().trim()] = binChildren[2];
                    let propertyNode = binChildren.find(ts.isPropertyAccessExpression);
                    let lastChild;
                    let propertyName = '';
                    let doc = '';
                    let propType = '';
                    let isPropertyAccess = false;
                    if (propertyNode) {
                        isPropertyAccess = true;
                        //console.log(propertyNode.getText() + ' - ' + propertyNode.getFullText());
                        let idNodes = propertyNode.getChildren(rootNode).filter(ts.isIdentifier);
                        let nodeName = propertyNode.getText().trim();
                        let propNames = nodeName.split('.');
                        lastChild = binChildren[binChildren.length - 1];
                        if (propNames[0] != simpleName)
                            return;
                        if (ts.isIdentifier(lastChild)) {
                            if (idToObjectNode[lastChild.getText().trim()])
                                lastChild = idToObjectNode[lastChild.getText().trim()];
                        }
                        //var names = propNames.splice(0, 1);
                        //let symbol = checker.getSymbolAtLocation(lastChild);
                        //doc = '';//ts.displayPartsToString(symbol.getDocumentationComment(checker));
                        propertyName = propNames.join(".");
                        if (propNames.length > 3)
                            return;
                        // if(propNames[1] == 'prototype')
                        // 	typeExporter.setAsClass();
                        // if(ts.isFunctionExpression(lastChild)) {
                        // 	let r = getFunctionExpressionType(lastChild);
                        // 	typeExporter.addField(FunctionType.create(propNames[2], r[0]));
                        // }else if(ts.isObjectLiteralExpression(lastChild)) {
                        // 	let r = getTypeFromObjectLiteralExpression(lastChild);
                        // 	var objLiteral = new ObjectLiteraltype(propNames[2]);
                        // 	objLiteral.setKeysType(r);
                        // 	typeExporter.addField(objLiteral);
                        // }
                        // var r = typeToDisplayParts(checker, checker.getTypeAtLocation(lastChild), void 0, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.NoTruncation);
                        // console.log(getTypeFromDisplayParts(r));
                    }
                    else {
                        if (ts.isIdentifier(binChildren[0])) {
                            if (ts.isObjectLiteralExpression(binChildren[2]))
                                idToObjectNode[binChildren[0].getText()] = binChildren[2];
                            if (binChildren[0].getText().trim() == simpleName) {
                                if (binChildren[1].kind == ts.SyntaxKind.FirstAssignment) {
                                    typeExporter.clearAll();
                                    lastChild = binChildren[2];
                                    propertyName = simpleName;
                                    if (ts.isCallExpression(lastChild)) {
                                        if (lastChild.getText().trim() == 'Class.create()') {
                                            typeExporter.clearAll();
                                            typeExporter.setAsClass();
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (lastChild && ts.isIdentifier(lastChild) && idToObjectNode[lastChild.getText()]) {
                        //test_5009.txt
                        lastChild = idToObjectNode[lastChild.getText()];
                    }
                    if (!lastChild)
                        return;
                    //console.log(doc);
                    lineInfo = getLineInfo(lastChild);
                    if (ts.isNumericLiteral(lastChild)) {
                        typeExporter.addField(new NumericLiteralType(propertyName, doc).setLineInfo(lineInfo));
                    }
                    else if (ts.isStringLiteral(lastChild))
                        typeExporter.addField(new StringLiteralType(propertyName, doc).setLineInfo(lineInfo));
                    else if (ts.isObjectLiteralExpression(lastChild)) {
                        //getObjectLiteralExpression(lastChild);
                        let typeInfo = getTypeFromObjectLiteralExpression(lastChild, true);
                        let objLiteral = new ObjectLiteraltype(propertyName, doc);
                        objLiteral.setLineInfo(getLineInfo(lastChild));
                        objLiteral.setKeysType(typeInfo);
                        typeExporter.addField(objLiteral);
                        if (!isPropertyAccess)
                            typeExporter.setAsObjectLiteral();
                    }
                    else if (ts.isFunctionExpression(lastChild)) {
                        let result = getFunctionExpressionType(lastChild);
                        if (!isPropertyAccess) {
                            typeExporter.addConstructorFunction(FunctionType.create(simpleName, result[0]));
                            typeExporter.setAsFunction();
                        }
                        else {
                            typeExporter.addField(FunctionType.create(propertyName, result[0]));
                        }
                    }
                    else if ((propertyName == simpleName + '.prototype') && ts.isCallExpression(lastChild)) {
                        let propAccessNode = lastChild.getChildren().find(ts.isPropertyAccessExpression);
                        if (propAccessNode && propAccessNode.getText() == 'Object.extendsObject') {
                            let syntaxList = lastChild.getChildren().find(val => {
                                return val.kind == ts.SyntaxKind.SyntaxList;
                            });
                            let count = syntaxList.getChildCount();
                            if (count != 3)
                                return;
                            let baseNode = syntaxList.getChildAt(0, rootNode);
                            if (!ts.isIdentifier(baseNode))
                                baseNode = undefined;
                            if (!baseNode)
                                baseNode = syntaxList.getChildren().find(ts.isPropertyAccessExpression);
                            if (!baseNode) {
                                console.log('unable to find the base class information');
                                return;
                            }
                            typeExporter.setAsClass();
                            let superClsName = baseNode.getText();
                            if (superClsName.split('.').length == 1)
                                superClsName = scopeName + '.' + superClsName;
                            typeExporter.setBaseType(superClsName);
                            let objLitNode = syntaxList.getChildren().find(ts.isObjectLiteralExpression);
                            if (!objLitNode) {
                                let syntChilds = syntaxList.getChildren();
                                let idNode = syntChilds[syntChilds.length - 1];
                                if (ts.isIdentifier(idNode)) {
                                    let name = idNode.getText().trim();
                                    objLitNode = idToObjectNode[name];
                                }
                            }
                            if (objLitNode) {
                                let result = getTypeFromObjectLiteralExpression(objLitNode, true);
                                let obj = new ObjectLiteraltype(propertyName);
                                obj.setLineInfo(lineInfo);
                                obj.setKeysType(result);
                                typeExporter.addField(obj);
                            }
                            else {
                                let flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                                propType = checker.typeToString(checker.getTypeAtLocation(syntaxList.getChildAt(count - 1)), void 0, flags);
                                if (propType.indexOf('typeof') == -1)
                                    addToDefaultType(propertyName, syntaxList.getChildAt(count - 1), doc);
                            }
                        }
                        else {
                            let syntaxList = getSyntaxListFromCallExpression(lastChild);
                            let iifNodes = []; //getStatementsFromIIFCallExpression(currentStatement);
                            if (syntaxList)
                                iifNodes = syntaxList.getChildren(rootNode);
                            iifNodes.forEach((iifNode => {
                                parseCurrentStatements(iifNode, false);
                            }));
                            let retStatements = iifNodes.filter(ts.isReturnStatement);
                            if (retStatements.length > 0) {
                                if (retStatements.length > 1)
                                    console.warn("Found multiple return statements in prototype assignment");
                                let finalRetStatement = retStatements[retStatements.length - 1].getChildren()[1];
                                let objLitNode;
                                if (ts.isIdentifier(finalRetStatement))
                                    objLitNode = idToObjectNode[finalRetStatement.getText()];
                                else if (ts.isObjectLiteralExpression(finalRetStatement)) {
                                    objLitNode = finalRetStatement;
                                }
                                else if (ts.isCallExpression(finalRetStatement)) {
                                    //test_5016.txt
                                    let childs = finalRetStatement.getChildren();
                                    if (childs.length !== 4)
                                        return;
                                    let firstOne = childs[0];
                                    if (!ts.isPropertyAccessExpression(firstOne))
                                        return;
                                    if (firstOne.getText() !== 'Object.extendsObject')
                                        return;
                                    let syntaxList = finalRetStatement.getChildren().find(val => val.kind == ts.SyntaxKind.SyntaxList);
                                    if (!syntaxList)
                                        return;
                                    let subChilds = syntaxList.getChildren();
                                    if (subChilds.length != 3)
                                        return;
                                    let baseNode = subChilds[0];
                                    if (!ts.isPropertyAccessExpression(baseNode))
                                        return;
                                    let objLiteral = subChilds[2];
                                    if (!ts.isObjectLiteralExpression(objLiteral))
                                        return;
                                    typeExporter.setAsClass();
                                    let superClsName = baseNode.getText();
                                    if (superClsName.split('.').length == 1)
                                        superClsName = scopeName + '.' + superClsName;
                                    typeExporter.setBaseType(superClsName);
                                    objLitNode = objLiteral;
                                }
                                if (objLitNode) {
                                    let result = getTypeFromObjectLiteralExpression(objLitNode, true);
                                    let obj = new ObjectLiteraltype(propertyName);
                                    obj.setLineInfo(lineInfo);
                                    obj.setKeysType(result);
                                    typeExporter.addField(obj);
                                    return;
                                }
                            }
                            addToDefaultType(propertyName, lastChild, doc);
                        }
                    }
                    else {
                        // let flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.MultilineObjectLiterals;
                        // propType = checker.typeToString(checker.getTypeAtLocation(lastChild), void 0, flags);
                        addToDefaultType(propertyName, lastChild, doc);
                    }
                }
                else if (ts.isFunctionDeclaration(currentStatement)) {
                    let fnName = currentStatement.name.getText();
                    if (fnName != simpleName)
                        return;
                    isTypeFound = true;
                    let symbol = checker.getSymbolAtLocation(currentStatement.name);
                    let thisType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                    let r = thisType.getCallSignatures().map((val) => {
                        return serializeSignature(val);
                    });
                    var typedefReturnType = getReturnTypeFromTypeDefs(currentStatement);
                    //console.log(typedefReturnType);
                    if (typedefReturnType.length > 0)
                        r[0].returnType = typedefReturnType;
                    if (currentStatement.parameters.length > 0) {
                        let i = 0;
                        currentStatement.parameters.forEach(par => {
                            //let parType = ts.typeToDisplayParts(checker, checker.getTypeAtLocation(par), rootNode, 8388608 /* InTypeAlias */);
                            r[0].parameters[i++].isOptional = checker.isOptionalParameter(par);
                        });
                    }
                    typeExporter.setAsFunction();
                    typeExporter.addConstructorFunction(FunctionType.create(fnName, r[0]));
                    let fields = getThisInitializer(currentStatement);
                    if (fields.length > 0)
                        typeExporter.setAsClass();
                    fields.forEach(field => {
                        typeExporter.addField(field);
                    });
                    let superNodeJSTag = ts.getJSDocAugmentsTag(currentStatement);
                    if (!superNodeJSTag)
                        return;
                    let jsDocChilds = superNodeJSTag.getChildren();
                    if (jsDocChilds.length != 2)
                        return;
                    let jsDocIdObject = jsDocChilds[0];
                    if (!jsDocIdObject)
                        return;
                    let jsDocSuperType = checker.getTypeAtLocation(jsDocChilds[1]);
                    if (!jsDocSuperType)
                        return;
                    let displayParts = typeToDisplayParts(checker, jsDocSuperType, void 0, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.NoTruncation);
                    let superName = getTypeFromDisplayParts(displayParts);
                    if (superName.length > 0 && superName != 'any')
                        typeExporter.setBaseType(superName);
                }
                else if (ts.isClassDeclaration(currentStatement)) {
                    typeExporter.setAsES6();
                }
            }
            for (let i = 0; rootNode && i < rootNode.statements.length; i++) {
                let currentStatement = rootNode.statements[i];
                parseCurrentStatements(currentStatement);
            }
            return typeExporter;
        }
        TSChecker.parseSIWithTypeChecker = parseSIWithTypeChecker;
        const ATypeFileName = 'atypes.ts';
        const SIFileName = 'point.js';
        const LIBFileName = 'node_modules/@types/snlib/index.d.ts';
        class MyCompilerHost {
            constructor(snlib, anonymousFileContent, siContent) {
                this.snlib = snlib;
                this.sourceFiles = {};
                this.outFiles = {};
                this.updateContent(LIBFileName, this.snlib);
                if (anonymousFileContent)
                    this.updateContent(ATypeFileName, anonymousFileContent);
                if (siContent)
                    this.updateContent(SIFileName, siContent);
            }
            getOutFiles() {
                return this.outFiles;
            }
            disposeAll() {
                for (let fileName in this.sourceFiles) {
                    ts.disposeEmitNodes(this.sourceFiles[fileName]);
                    this.sourceFiles[fileName] = null;
                }
            }
            updateContent(fileName, content) {
                if (this.sourceFiles[fileName]) {
                    ts.disposeEmitNodes(this.sourceFiles[fileName]);
                    this.sourceFiles[fileName] = null;
                }
                var source = ts.createSourceFile(fileName, content, ts.ScriptTarget.ES5, true, fileName.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
                this.sourceFiles[fileName] = source;
            }
            updateLib(newContent) {
                this.updateContent(LIBFileName, newContent);
            }
            updateAnonymousContent(newContent) {
                this.updateContent(ATypeFileName, newContent);
            }
            updateTypeScriptSI(newContent) {
                this.updateContent("point.ts", newContent);
            }
            updateSI(newContent) {
                this.updateContent(SIFileName, newContent);
            }
            getTypeInfo(currentSI, checker, typeName = "Point") {
                var typeInfo = null;
                typeInfo = parseSIWithTypeChecker(currentSI, typeName, this.sourceFiles[SIFileName], checker);
                return typeInfo;
            }
            getSourceFile(fileName) {
                if (!this.sourceFiles[fileName])
                    return undefined;
                return this.sourceFiles[fileName];
            }
            writeFile(fileName, text) {
                this.outFiles[fileName] = text;
            }
            getDefaultLibFileName() {
                return "lib.d.ts";
            }
            useCaseSensitiveFileNames() {
                return false;
            }
            getCanonicalFileName(fileName) {
                return fileName;
            }
            getCurrentDirectory() {
                return "";
            }
            getNewLine() {
                return "\r\n";
            }
            fileExists(fileName) {
                return true;
            }
            readFile(fileName) {
                console.log('read file ' + fileName);
                return "";
            }
            directoryExists() {
                return true;
            }
            getDirectories() {
                return [];
            }
        }
        TSChecker.MyCompilerHost = MyCompilerHost;
        var compilerOptions = {
            "allowNonTsExtensions": true,
            "target": 1,
            "allowJs": true,
            "sourceMap": true,
            noLib: true,
            /// very very important paramter
            noErrorTruncation: true,
            types: ['snlib'],
            linter: false
        };
        var javaDef;
        var javaScopedDef;
        var tableDef;
        var jsDef;
        var javaAPI, javaScopedApi, tableAPI, jsAPI;
        function getTableDefintions(isScoped = false) {
            let jsonPlayload;
            if (typeof tableDef.json_value === 'string')
                jsonPlayload = JSON.parse(tableDef.json_value).api;
            else
                jsonPlayload = tableDef.json_value.api;
            let tableDTS = schemaParser_1.SchemaDTSGenerator.generate(jsonPlayload.tableMap, jsonPlayload.choiceMap, isScoped);
            //tableAPI = (JSON.parse(tableDef.json_value) as DefJSONType).api + '\n\n' + tableDef.customization + '\n\n' + jsDef.customization;
            tableAPI = tableDTS + '\n\n\n' + tableDef.customization + '\n\n';
            return tableAPI;
        }
        function updateDefintions(tsDef) {
            tsDef.forEach((val, index, ar) => {
                if (val.name == 'javaGlobalAPI')
                    javaDef = val;
                else if (val.name == 'tableAPI')
                    tableDef = val;
                else if (val.name == 'javaScopedAPI')
                    javaScopedDef = val;
                else if (val.name == 'jsAPI')
                    jsDef = val;
            });
            if (typeof javaDef.json_value == 'string')
                javaAPI = JSON.parse(javaDef.json_value).api + '\n\n' + javaDef.customization;
            else
                javaAPI = javaDef.json_value.api + '\n\n' + javaDef.customization;
            if (typeof javaScopedDef.json_value == 'string')
                javaScopedApi = JSON.parse(javaScopedDef.json_value).api + '\n\n' + javaDef.customization;
            else
                javaScopedApi = javaScopedDef.json_value.api + '\n\n' + javaScopedDef.customization;
            if (typeof tableDef.json_value == 'string') {
                // const jsonPlayload = JSON.parse(tableDef.json_value as any).api as {tableMap: any, choiceMap: any};
                // const tableDTS = SchemaDTSGenerator.generate(jsonPlayload.tableMap, jsonPlayload.choiceMap);
                // //tableAPI = (JSON.parse(tableDef.json_value) as DefJSONType).api + '\n\n' + tableDef.customization + '\n\n' + jsDef.customization;
                // tableAPI = tableDTS + '\n\n\n' + tableDef.customization + '\n\n';
                tableAPI = getTableDefintions();
            }
            else
                tableAPI = tableDef.json_value.api + '\n\n' + tableDef.customization;
            if (typeof jsDef.json_value == 'string')
                jsAPI = JSON.parse(jsDef.json_value).api;
            else
                jsAPI = jsDef.json_value.api;
        }
        function generateSnLib(name, isGlobalFormat = false) {
            var tokens = name.split('.');
            var scopeName = tokens[0];
            var typeName = tokens[1];
            var jsTypeStrings = '';
            if (isGlobalFormat) {
                if (!jsAPI[scopeName]) {
                    console.log("Unable to find the scope falling back to default one " + name);
                    return '';
                }
                jsAPI[scopeName].forEach(val => {
                    var apiTokens = val.api.split('.');
                    if (apiTokens[1] != typeName && typeof val.gf == 'string')
                        jsTypeStrings += val.gf + ';\n';
                });
                //let typeDefs = getTypeDefs(jsAPI);
                //let typeDefContent = generateTypedefDecl(typeDefs);
                return jsTypeStrings; // + '\n\n' + typeDefContent;
            }
            let dependentSuperCls = {};
            for (let apiScope in jsAPI) {
                let thisDefs = jsAPI[apiScope];
                thisDefs.forEach(item => {
                    if (!item.sp)
                        return;
                    let tokens = item.sp.split('.');
                    if (tokens.length == 1) {
                        dependentSuperCls[apiScope] = dependentSuperCls[apiScope] || {};
                        dependentSuperCls[apiScope][item.sp] = true;
                        return;
                    }
                    dependentSuperCls[tokens[0]] = dependentSuperCls[tokens[0]] || {};
                    dependentSuperCls[tokens[0]][tokens[1]] = true;
                });
            }
            for (let apiScope in jsAPI) {
                let thisDefs = jsAPI[apiScope];
                jsTypeStrings += 'declare namespace ' + apiScope + ' {';
                thisDefs.forEach(val => {
                    //let apiTokens = val.api.split('.');
                    if ((typeof val.gf == 'string') && (SITSFormat.isPublic(val.f) || apiScope == scopeName)) {
                        jsTypeStrings += '\n' + val.tf + '\n' + val.af + '\n';
                    }
                    else {
                        if (!dependentSuperCls[apiScope])
                            return;
                        if (dependentSuperCls[apiScope][val.api])
                            jsTypeStrings += '\n' + val.tf + '\n';
                    }
                });
                jsTypeStrings += '}\n';
            }
            tableAPI = getTableDefintions(scopeName !== 'global');
            if (scopeName == 'global')
                return javaAPI + tableAPI + jsTypeStrings;
            else
                return javaScopedApi + tableAPI + jsTypeStrings;
        }
        TSChecker.dotWalkingTransformer = (context) => (rootNode) => {
            function visit(node) {
                node = ts.visitEachChild(node, visit, context);
                //if (node.kind != ts.SyntaxKind.TemplateExpression)
                if (!ts.isTemplateExpression(node))
                    return node;
                let text = node.getFullText();
                let regExp = getDotWalkingRegExp();
                let regArray = text.match(regExp);
                if (!regArray)
                    return node;
                if (regArray.length == 0)
                    return node;
                var tokens = regArray[0].split('.');
                if (tokens.length <= 1)
                    return node;
                function replace(str) {
                    let copyStr = str.replace(regExp, ($0, $1, $2, $3, $4, $5) => {
                        var copy$2 = $2;
                        //FIXME: servicenow needs to fix this bug
                        //$2 = $2.replace(/^\$\${/, '');
                        //$2 = $2.replace(/\}$/, '');
                        if ($2.startsWith('$$'))
                            $2 = $2.substring(2, $2.length);
                        if ($2.startsWith('{'))
                            $2 = $2.substring(1, $2.length);
                        if ($2.endsWith('}'))
                            $2 = $2.substr(0, $2.length - 1);
                        let tokens = $2.split('.');
                        if (tokens.length == 1)
                            return copy$2;
                        tokens.splice(0, 1);
                        return $1 + tokens.join('.') + $3;
                    });
                    //FIXME: why extra space is appearing at first position
                    return copyStr.trim();
                }
                let strLiteral = replace(text);
                return ts.createStringLiteral(strLiteral);
            }
            //FIXME: why it is coming "Module" for javascript files. for typescript it is "sourceFile" appearing
            if (!!rootNode['sourceFiles'])
                rootNode = rootNode['sourceFiles'][0];
            return ts.visitNode(rootNode, visit);
        };
        function initTypeInfoForSingleSI(libSrc, tsDef, siRec) {
            updateDefintions(tsDef);
            let host; // = new MyCompilerHost(libSrc);
            let program;
            let sourceName = 'point.js';
            let previousAPIName;
            //let typeDefs = getTypeDefs(jsAPI);
            //let typeDefContent = generateTypedefDecl(typeDefs);
            let typeDefs = getTypeDefsAsScopeMap(jsAPI, siRec.sys_id);
            let typeDefContent = generateTypedefDeclFromScopemap(typeDefs);
            var linter = new eslint.Linter();
            return {
                dispose: function () {
                    if (host) {
                        host.disposeAll();
                        host = null;
                    }
                    if (program)
                        program = null;
                },
                getTypeInfo: function (siRecord, options) {
                    if (!siRecord.api_name)
                        siRecord.api_name = 'global.point';
                    if (!previousAPIName)
                        previousAPIName = siRecord.api_name;
                    var scopeName = siRecord.getScopeAndAPIMap();
                    if (!host || previousAPIName != siRecord.api_name) {
                        let flags = 0;
                        if (siRecord.access == SIAccessType.public)
                            flags |= SIFlags.public;
                        flags |= SIFlags.cls;
                        let currentSITSFormat = new SITSFormat(siRecord.api_name, siRecord.sys_id, 'export class ' + scopeName.name + ' { prop: number; }', '', '', siRecord.access, '', flags);
                        // FIXME: 
                        // if current SI reference itself via jsdoc param or return type, this will trick the compiler
                        // it is just a trick to fool the compiler.
                        let currentSIDecl = siRecord.formatCurrentSITSFormat(currentSITSFormat);
                        var fullDecl = libSrc + '\n\n' + generateSnLib(siRecord.api_name) + '\n\n\n' + generateSnLib(siRecord.api_name, true);
                        fullDecl += '\n\n' + currentSIDecl + '\n\n' + typeDefContent + '\n\n' + jsDef.customization + '';
                        if (!host)
                            host = new MyCompilerHost(fullDecl);
                        // if someone changes the apiname , we need to rebuild the whole symbol tree.
                        if (previousAPIName != siRecord.api_name) {
                            previousAPIName = siRecord.api_name;
                            host.updateLib(fullDecl);
                        }
                    }
                    let tsResult = {
                        js: '',
                        declaration: '',
                        sourceMap: '',
                        afterDotWalK: '',
                        errorMsg: exports.ERROR_MSG,
                        linterErrors: [],
                        tsDeclaration: ''
                    };
                    const pointOutFile = 'pointOut.js';
                    let canEmitDecl = parseFloat(ts.versionMajorMinor) >= 3.7;
                    if (siRecord.isJavascript()) {
                        options.allowJs = true;
                        options.declaration = canEmitDecl && self.recordConfig.isES6;
                        options.removeComments = true;
                        options.noEmitOnError = true;
                        options.outFile = pointOutFile;
                        let es6 = siRecord.tsscript;
                        if (self.recordConfig.isES6 && !self.recordConfig.isFromScriptRunner)
                            es6 += `\n/// @ts-ignore\n${scopeName.name} = global.__extends(Class.create(), ${scopeName.name});\n`;
                        host.updateSI(es6);
                        sourceName = "point.js";
                    }
                    else {
                        options.allowJs = false;
                        options.declaration = true;
                        let es6 = siRecord.tsscript;
                        if (!self.recordConfig.isFromScriptRunner)
                            es6 += `\n/// @ts-ignore\n${scopeName.name} = global.__extends(Class.create(), ${scopeName.name});\n`;
                        host.updateTypeScriptSI(es6);
                        sourceName = 'point.ts';
                    }
                    options.noLib = true;
                    options.types = ['snlib'];
                    options.noResolve = false;
                    options.skipLibCheck = true;
                    program = ts.createProgram([sourceName], options, host, program);
                    let emitResult = program.emit(program.getSourceFile(sourceName), undefined, undefined, undefined, {
                        before: [TSChecker.dotWalkingTransformer]
                    });
                    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
                    allDiagnostics.forEach(diagnostic => {
                        if (diagnostic.file) {
                            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
                        }
                        else {
                            console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
                        }
                    });
                    if (emitResult.emitSkipped)
                        return tsResult;
                    let outFiles = host.getOutFiles();
                    if (siRecord.isTypescript()) {
                        tsResult.js = outFiles['point.js'];
                        tsResult.sourceMap = outFiles['point.js.map'];
                    }
                    else {
                        if (canEmitDecl)
                            tsResult.tsDeclaration = outFiles['pointOut.d.ts'];
                        tsResult.js = outFiles[pointOutFile];
                        tsResult.sourceMap = outFiles[pointOutFile + '.map'];
                    }
                    tsResult.afterDotWalK = siRecord.tsscript;
                    tsResult.errorMsg = '';
                    if (siRecord.isTypescript()) {
                        tsResult.tsDeclaration = tsResult.declaration = outFiles['point.d.ts'];
                        return tsResult;
                    }
                    var result;
                    try {
                        result = parseSIWithTypeChecker(siRecord, siRecord.api_name, program.getSourceFile(sourceName), program.getTypeChecker());
                        result.sysId = siRecord.sys_id;
                        result.accessType = siRecord.access;
                        let siDeclFormat = result.toMinifiedInterfaceFormat();
                        tsResult.declaration = JSON.stringify(siDeclFormat);
                        tsResult.afterDotWalK = siRecord.tsscript;
                        if (options.linter)
                            tsResult.linterErrors = linter.verify(siRecord.tsscript, linterConfig.eslintConfig);
                    }
                    catch (e) {
                        tsResult.errorMsg = JSON.stringify({ error: e + '', id: 1 });
                    }
                    return tsResult;
                }
            };
        }
        TSChecker.initTypeInfoForSingleSI = initTypeInfoForSingleSI;
        function generateTypeInfo(items, libSrc, tsDef, progressCallback) {
            updateDefintions(tsDef);
            var formatterResult = {};
            var globalItems = []; //items.filter(item => item.sys_scope.value == 'global');
            var scopeToItems = {};
            items.forEach(item => {
                if (!(item instanceof ClientSIRecordData))
                    item = new ClientSIRecordData(item);
                if (item.sys_scope.value == 'global') {
                    globalItems.push(item);
                    return;
                }
                if (!scopeToItems[item.sys_scope.value])
                    scopeToItems[item.sys_scope.value] = [];
                scopeToItems[item.sys_scope.value].push(item);
            });
            var toBeParsed = [];
            if (globalItems.length > 0)
                toBeParsed.push(globalItems);
            for (var prop in scopeToItems)
                toBeParsed.push(scopeToItems[prop]);
            var host = null;
            var program;
            var result = [];
            var fileNames = ['point.js', 'atypes.ts'];
            var errorItems = [];
            var counter = 0;
            var previousScope = 'global';
            toBeParsed.forEach(scopeSIItems => {
                scopeSIItems.forEach(item => {
                    counter++;
                    var percentage = (100 * counter / items.length).toFixed(2);
                    if (progressCallback) {
                        try {
                            progressCallback({ name: item.api_name, percentage: percentage, sysId: item.sys_id });
                        }
                        catch (ex) {
                        }
                    }
                    if (!(item instanceof ClientSIRecordData))
                        item = new ClientSIRecordData(item);
                    var apiTokens = item.getScopeAndAPIMap();
                    if (typeof item.script != 'string') {
                        console.log('skipping: undefined script found for api ' + item.api_name);
                        return;
                    }
                    if (BlockedSI[item.api_name] || /^sn_codesearch\./.test(item.api_name) || /\.CodeNowTempDebugger$/.test(item.api_name)) {
                        console.warn('Skipping BlockedScript => ' + item.api_name);
                        return;
                    }
                    let anonymousContent = generateSnLib(item.api_name, true);
                    if (!host) {
                        let snLibContent = generateSnLib(item.api_name);
                        //let typedefContent = generateTypedefDecl(getTypeDefs(jsAPI));
                        //getTypeDefsAsScopeMap(getTypeDefs(jsAPI, "-1"))
                        let typeDefMap = getTypeDefsAsScopeMap(jsAPI, "-1");
                        let typedefContent = generateTypedefDeclFromScopemap(typeDefMap);
                        host = new MyCompilerHost(libSrc + '\n\n' + snLibContent + '\n\n' + typedefContent);
                    }
                    host.updateAnonymousContent(anonymousContent);
                    host.updateSI(item.script);
                    if (apiTokens.scope != previousScope) {
                        let snLibContent = generateSnLib(item.api_name);
                        host.updateLib(libSrc + '\n\n' + snLibContent);
                        previousScope = apiTokens.scope;
                        program = undefined;
                    }
                    program = ts.createProgram(fileNames, compilerOptions, host, program);
                    try {
                        let typeInfo = host.getTypeInfo(item, program.getTypeChecker(), item.api_name);
                        typeInfo.accessType = item.access;
                        typeInfo.sysId = item.sys_id;
                        if (typeInfo)
                            result.push(typeInfo);
                        if (!formatterResult[apiTokens.scope])
                            formatterResult[apiTokens.scope] = new Array();
                        var minifiedFormat = typeInfo.toMinifiedInterfaceFormat();
                        formatterResult[apiTokens.scope].push(minifiedFormat);
                        if (progressCallback) {
                            try {
                                progressCallback({ name: item.api_name, percentage: percentage, sysId: item.sys_id, decl: minifiedFormat });
                            }
                            catch (ex) {
                            }
                        }
                        //formatterResult[apiTokens[0]].push(typeInfo.toInterfaceFormat());
                    }
                    catch (e) {
                        errorItems.push(item.api_name);
                    }
                });
            });
            return {
                formatterResult: formatterResult,
                types: result,
                errors: errorItems,
                program: program,
                host: host,
            };
        }
        TSChecker.generateTypeInfo = generateTypeInfo;
    })(TSChecker = exports.TSChecker || (exports.TSChecker = {}));
});
define("tsCompilerOptions", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        allowNonTsExtensions: true,
        module: 0,
        noResolve: true,
        suppressOutputPathCheck: true,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        target: 1,
        noImplicitAny: false,
        strict: false,
        strictNullChecks: false,
        noImplicitThis: false,
        noImplicitReturns: false,
        experimentalDecorators: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        declaration: true,
        sourceMap: true,
        jsx: 2,
        jsxFactory: 'snc.createElement',
        //importHelpers: true,
        noEmitHelpers: false,
        isolatedModules: false,
        noEmitOnError: false,
        stripInternal: false,
        allowJs: true,
        checkJs: false,
        noFallthroughCasesInSwitch: false,
        allowUnreachableCode: false,
        linter: false,
        inlineSourceMap: false,
        inlineSources: false,
    };
});
define("seismic", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.seismicObj = { "dts": "interface DefaultLike<T = any> {\n\tdefault: T\n}\ninterface ComputedLike<T = any> {\n\tcomputed(...args: any[]): T\n}\n\n\n//type ExtractProperties<T> = { [prop in keyof T]: T[prop] extends DefaultLike ? T[prop]['default']: T[prop] extends ComputedLike ? T[prop]['computed'] extends (...args: any[]) => infer R ? R: any: any};\n// type UnknownPropKeys = 'readonly' | 'reflect' | 'unstableParse' | 'unstablePreseveEmptyStr' | 'selectable' | 'schema';\n// type ExtractComponentProps<T, U, E = UnknownPropKeys> = T extends U ? T : T extends E ? never : T;\n// type ComponentPropValueOf<T> = T[ExtractComponentProps<keyof T, 'default'>] extends null ? any : T[ExtractComponentProps<keyof T, 'default'>];\n// type ComponentPropType<T> = { [p in keyof T]: ComponentPropValueOf<T[p]> extends (...args) => infer R ? R : ComponentPropValueOf<T[p]> };\ntype ComponentPropType<T> = { [prop in keyof T]: T[prop] extends DefaultLike ? T[prop]['default'] : T[prop] extends ComputedLike ? T[prop]['computed'] extends (...args: any[]) => infer R ? R : any : any };\n\ninterface ActionPayloadBase {\n\tmeta?: {\n\t\tcomponentName?: string,\n\t\tevent?: Event,\n\t\thoiestHost?: any,\n\t\tid?: string\n\t},\n\terror?: any,\n\tstopPropagation(): void\n}\ninterface ActionPayload<T extends keyof ActionTypes> extends ActionPayloadBase {\n\ttype: T,\n\tpayload?: ActionTypes[T],\n}\ntype StateOperation = 'set' | 'assign' | 'merge' | 'pop' | 'push' | 'shift' | 'unshift' | 'splice' | 'concat';\ninterface EventHandlerArgs<P, T extends ComponentState, Actions = Record<string, any>> {\n\taction: {\n\t\ttype: keyof DocumentEventMap,\n\t\terror: any,\n\t\tmeta: any,\n\t\tpayload: { event: Event, host: Element },\n\t\tstopPropagation(): void;\n\t},\n\thost: Element,\n\tproperties: P,\n\tstate: T,\n\tdispatch<Name extends keyof Actions>(type: Name, payload?: Name extends keyof ActionTypes ? ActionTypes[Name] : {}, meta?: any, error?: boolean | null): void;\n\tupdateState(obj: Partial<{ [prop in keyof Omit<T, 'properties'>]: T[prop] }>): void;\n\tupdateState(obj: { path: string, value: any, operation?: StateOperation }): void;\n\tupdateState(callback: (state: T) => DeclarativePayload): void;\n\tupdateProperties(obj: Partial<{ [prop in keyof T['properties']]: T['properties'][prop] }>): void;\n\tupdateProperties(callback: (state: T) => DeclarativePayload): void;\n}\n\ninterface ComponentState {\n\tproperties?: Record<string, any>\n}\ninterface DeclarativePayload {\n\tpath?: string,\n\tvalue?: any,\n\toperation?: StateOperation,\n\tshouldUpdate?: boolean,\n\tshouldRender?: boolean,\n\tstart?: number,\n\tdeleteCount?: number\n}\ninterface ActionHandlerArgs<P, AS extends ComponentState, D, ActionName extends keyof ActionTypes> {\n\taction: ActionPayload<ActionName>,\n\tdispatch: D,\n\tproperties: P,\n\tstate: AS,\n\thost: HTMLElement,\n\tupdateProperties(obj: Partial<{ [prop in keyof P]: P[prop] }>): void,\n\tupdateProperties(callback: (state: AS) => DeclarativePayload): void;\n\tupdateState(obj: Partial<{ [prop in keyof Omit<AS, 'properties'>]: AS[prop] }>): void,\n\tupdateState(obj: { path: string, value: any, operation?: StateOperation }): void\n\tupdateState(callback: (state: AS) => DeclarativePayload): void;\n}\n\ntype ActionHandler<P, AS, AD, ActionName extends keyof ActionTypes, Context = ActionHandlerArgs<P, AS, AD, ActionName>> = ((args: Context) => void) | {\n\teffect(...args: any[]): any,\n\targs?: Array<any>,\n\tinterceptors?: Array<((context?: { coeffects: Context, effects: Array<Context> }) => any) | { before?(context?: { coeffects: Context, effects: Array<Context> }): any, after?(context?: { coeffects: Context, effects: Array<Context> }): any }>,\n\tmodifiers?: { name: 'throttle', limit: number } | { name: 'debounce', delay: number },\n\tstopPropagation?: boolean\n};\ninterface DispatchFn<ActionName = string> {\n\ttype: ActionName,\n\tpayload: ActionName extends keyof ActionTypes ? ActionTypes[ActionName] : any,\n\tmeta?: any,\n\terror?: any,\n\tshouldDispatch?: boolean\n}\ninterface Dispatcher<T extends ComponentState, Actions = Record<string, any>> {\n\t<K extends keyof Actions>(type: K extends keyof Actions ? K : string, payload?: K extends keyof ActionTypes ? ActionTypes[K] : any, meta?: any, error?: boolean | null): void,\n\t(fn: (e: { state: Omit<T, 'properties'>, properties: T['properties'] }) => DispatchFn<keyof ActionTypes | string>): void,\n\tupdateState(obj: Partial<{ [prop in keyof Omit<T, 'properties'>]: T[prop] }>): void;\n\tupdateState(obj: DeclarativePayload): void;\n\tupdateState(callback: (state: T) => DeclarativePayload): void;\n\tupdateProperties(obj: Partial<{ [prop in keyof T['properties']]: T['properties'][prop] }>): void;\n\tupdateProperties(callback: (state: T) => DeclarativePayload): void;\n}\ninterface ActionDispatcher<T extends ComponentState, Actions, ActionName extends keyof ActionTypes> extends Dispatcher<T, Actions> {\n\taction?: ActionPayload<ActionName>\n}\ntype AState<RawProperties, InitialState> = InitialState & { properties: ComponentPropType<RawProperties> };\ninterface Behavior {\n\tname: string,\n\tproperties: Record<string, DefaultLike | ComputedLike>,\n\tinitialState: Record<string, any>,\n\tactionHandlers: Record<string, Function | { connect(): void, stopPropagation: boolean }>,\n\teventHandlers: []\n}\n\ndeclare module \"@servicenow/ui-core\" {\n\tfunction createCustomElement<RawProperties, InitialState, Actions,\n\t\tProperties = ComponentPropType<RawProperties>,\n\t\tComponentState = AState<RawProperties, InitialState>>(tagName: string,\n\t\t\tconfig: Partial<{\n\t\t\t\tproperties: RawProperties,\n\t\t\t\tinitialState: InitialState,\n\t\t\t\tactions: Actions,\n\t\t\t\tstyles: string,\n\t\t\t\tactionHandlers: Partial<{ [ActionName in keyof ActionTypes]: ActionHandler<Properties, ComponentState, ActionDispatcher<ComponentState, Actions, ActionName>, ActionName> }>,\n\t\t\t\teventHandlers: Array<{\n\t\t\t\t\tevents: Array<keyof DocumentEventMap>,\n\t\t\t\t\teffect?: (args: EventHandlerArgs<Properties, ComponentState, Actions>) => void,\n\t\t\t\t\ttarget?: Element | Document | Window\n\t\t\t\t}>,\n\t\t\t\tbehaviors: Array<Partial<Behavior>>,\n\t\t\t\ttransformState(state: Partial<ComponentState>): Partial<ComponentState>,\n\t\t\t\tview(state?: ComponentState, dispatch?: Dispatcher<ComponentState, Actions>): any\n\t\t\t}>): void;\n\tconst actionTypes: Readonly<{\n\t\t'COMPONENT_CONNECTED': 'SEISMIC_COMPONENT_CONNECTED',\n\t\t'COMPONENT_DISCONNECTED': 'SEISMIC_COMPONENT_DISCONNECTED',\n\t\t'COMPONENT_BOOTSTRAPPED': 'SEISMIC_COMPONENT_BOOTSTRAPPED',\n\t\t'COMPONENT_PROPERTY_CHANGED': 'SEISMIC_COMPONENT_PROPERTY_CHANGED',\n\t\t'COMPONENT_RENDERED': 'SEISMIC_COMPONENT_RENDERED',\n\t\t'COMPONENT_ERROR_THROWN': 'SEISMIC_COMPONENT_ERROR_THROWN',\n\t\t'COMPONENT_DOM_READY': 'SEISMIC_COMPONENT_DOM_READY'\n\t}>;\n\tconst errorLocations: Readonly<{\n\t\tEFFECT: \"SEISMIC_LOCATION_EFFECT\"\n\t\tEVENT: \"SEISMIC_LOCATION_EVENT\"\n\t\tINITIAL_STATE: \"SEISMIC_LOCATION_INITIAL_STATE\"\n\t\tINTERCEPTOR: \"SEISMIC_LOCATION_INTERCEPTOR\"\n\t\tLIFECYCLE: \"SEISMIC_LOCATION_LIFECYCLE\"\n\t\tPROPERTY: \"SEISMIC_LOCATION_PROPERTY\"\n\t\tRENDERER: \"SEISMIC_LOCATION_RENDERER\"\n\t\tTRANSFORM_STATE: \"SEISMIC_LOCATION_TRANSFORM_STATE\"\n\t\tVIEW: \"SEISMIC_LOCATION_VIEW\"\n\t}>;\n\tconst modes: Readonly<{\n\t\tCOMPONENT_MODE_ACTIVE: \"active\",\n\t\tCOMPONENT_MODE_SUSPEND: \"suspend\"\n\t}>;\n}\n\ndeclare module \"@servicenow/ui-renderer-snabbdom\" {\n\texport function Fragment(props: any, children: any): any;\n\texport function createRef(): { current: any };\n\texport function createElement(tag: string, props?: any, ...children: Array<any>): any;\n\texport function createElementFromNode(...any): any;\n\texport function createElementFromString(...any): any;\n\texport function createElementFromString(...any): any;\n\texport function createSlot(...any): any;\n\texport function dangerouslyCreateElementFromString(...any): any;\n\tconst snabbdom: {\n\t\tFragment: typeof Fragment,\n\t\tcreateRef: typeof createRef,\n\t\tcreateElement: typeof createElement,\n\t\tcreateElementFromNode: typeof createElementFromNode,\n\t\tcreateElementFromString: typeof createElementFromString,\n\t\tcreateSlot: typeof createSlot,\n\t\tdangerouslyCreateElementFromString: typeof dangerouslyCreateElementFromString\n\t}\n\texport default snabbdom;\n}\n\n\ndeclare module \"@servicenow/ui-effect-http\" {\n\tfunction createHttpEffect(url: string, options?: {\n        /**\n         * GET, POST, PUT, PATCH, DELETE (default: GET)\n         */\n\t\tmethod?: string,\n        /**\n         * Request headers\n         */\n\t\theaders?: HeadersInit,\n        /**\n         * Enable or disable batching for requests made by this effect (default: true)\n         */\n\t\tbatch?: boolean,\n        /**\n         * Encode URL (default: true)\n         */\n\t\tencodeURIComponent?: boolean,\n        /**\n         * Property in dispatched action to map to the data property of the HTTP request\n         */\n\t\tdataParam?: string,\n        /**\n         * Array of properties in dispatched action to map values to dynamic path variables ('api/users/:id')\n         */\n\t\tpathParams?: Array<string>,\n        /**\n         * Array of properties in dispatched action to map values to URL query string variables ('api/users?id=abc123)\n         */\n\t\tqueryParams?: Array<string>,\n        /**\n         * Action to be dispatched when the HTTP request has been issued\n         */\n\t\tstartActionType?: string,\n        /**\n         * Action to be dispatched when onprogress is triggered during the HTTP request\n         */\n\t\tprogressActionType?: string,\n        /**\n         * Action to be dispatched when the HTTP request has successfully completed\n         */\n\t\tsuccessActionType?: string,\n        /**\n         * Action to be dispatched when the HTTP request has failed\n         */\n\t\terrorActionType?: string\n\t}): Function;\n}\n\ndeclare module \"@servicenow/ui-effect-graphql\" {\n\tfunction createGraphQLEffect(query: string, options?: {\n        /**\n         * GET, POST, PUT, PATCH, DELETE (default: GET)\n         */\n\t\tmethod?: string,\n\t\tvariableList?: Array<string>,\n\t\ttemplateVarList?: Array<string>,\n\t\theaderList?: Record<string, string>,\n\t\tstartActionType?: string,\n\t\tsuccessActionType?: string,\n\t\terrorActionType?: string,\n\t\tsubscriptionStartedActionType?: string,\n\t\tsubscriptionSuccessActionType?: string,\n\t\tsubscriptionFailedActionType?: string,\n\t\tunsubscribeSuccessActionType?: string,\n\t\titemEnteredActionType?: string,\n\t\titemChangedActionType?: string,\n\t\titemExitedActionType?: string\n\t}): Function;\n}\n\ndeclare module \"@servicenow/ui-effect-amb\" {\n\tfunction createAmbSubscriptionEffect(channelId: string, options?: {\n\t\tsubscribeStartedActionType?: 'SUBSCRIPTION_STARTED',\n\t\tsubscribeSucceededActionType?: 'SUBSCRIPTION_SUCCEEDED',\n\t\tsubscribeFailedActionType?: 'SUBSCRIPTION_FAILED',\n\t\tmessageReceivedActionType?: 'MESSAGE_RECEIVED'\n\t\tunsubscribeSucceededActionType?: 'SUBSCRIPTION_UNSUBSCRIBED'\n\t}): Function;\n\tfunction createAmbEventEffect(...args: any[]): any;\n\tfunction createAmbPublishEffect(...args: any[]): any;\n}\n\ndeclare module \"sn-translate\" {\n\tfunction t(formatter: string, ...args: any): string;\n}\n\ndeclare module \"uxf-template-loader\" {\n\tfunction getTemplates(recordIds: Array<any>, consolidated?: boolean): Promise<any>;\n\tfunction getComponentsBySysIds(componentSysIds: Array<string>, consolidated?: boolean): Promise<any>;\n\tfunction getComponentsByTagNames(componentTagNames: Array<string>, consolidated?: boolean): Promise<any>;\n}\ndeclare module \"@devsnc/library-uxf\" {\n\tfunction getTemplates(recordIds: Array<any>, consolidated?: boolean): Promise<any>;\n\tfunction getComponentsBySysIds(componentSysIds: Array<string>, consolidated?: boolean): Promise<any>;\n\tfunction getComponentsByTagNames(componentTagNames: Array<string>, consolidated?: boolean): Promise<any>;\n}\ndeclare module \"@servicenow/behavior-fit\" {\n\texport function createFitBehavior(...args: any[]): any;\n\texport function fitBehavior(...args: any[]): any;\n\texport function getBestFitInfo(options: { target: HTMLElement, content: HTMLElement, container: any, positions: string, offset: [number, number], height: number, canScrollVertical?: boolean, canScrollHorizontal?: boolean }): any;\n\texport function getFitInfo(...args: any[]): any;\n\texport function setFitTarget(...args: any[]): any;\n\tconst behavior: Behavior\n\texport default behavior;\n}\n\ndeclare module \"@servicenow/behavior-focus\" {\n\tconst behavior: Behavior\n\texport default behavior;\n}\ndeclare module \"@servicenow/behavior-key-binding\" {\n\texport function findTabbableNodes(node: any): any;\n\texport function isFocusable(node: any): any;\n\tconst behavior: Behavior\n\texport default behavior;\n}\ndeclare module \"@servicenow/behavior-media-query\" {\n\tconst behavior: Behavior\n\texport default behavior;\n}\n\ndeclare module \"@servicenow/behavior-overlay\" {\n\tconst behavior: Behavior\n\texport default behavior;\n}\n\ndeclare module \"@servicenow/behavior-resize\" {\n\tconst behavior: Behavior\n\texport default behavior;\n}\n\ndeclare module \"@servicenow/behavior-rtl\" {\n\tconst behavior: Behavior\n\texport default behavior;\n}\n\ndeclare const snc: Readonly<{\n\truntime: {\n\t\tuiCore: typeof import(\"@servicenow/ui-core\"),\n\t\tsnabbdomCore: typeof import('@servicenow/ui-renderer-snabbdom'),\n\t\ttranslateCore: typeof import('sn-translate'),\n\t\tuxfCore: typeof import('uxf-template-loader'),\n\t\tuxfLib: typeof import('@devsnc/library-uxf'),\n\t\teffects: {\n\t\t\thttpEffect: typeof import('@servicenow/ui-effect-http'),\n\t\t\tgraphQLEffect: typeof import('@servicenow/ui-effect-graphql'),\n\t\t\tambEffect: typeof import('@servicenow/ui-effect-amb')\n\t\t},\n\t\tbehaviors: {\n\t\t\tfitBehavior: typeof import('@servicenow/behavior-fit'),\n\t\t\tfocusBehavior: typeof import('@servicenow/behavior-focus'),\n\t\t\tkeyBindingBehavior: typeof import('@servicenow/behavior-key-binding'),\n\t\t\tmediaQueryBehavior: typeof import('@servicenow/behavior-media-query'),\n\t\t\toverlayBehavior: typeof import('@servicenow/behavior-overlay'),\n\t\t\tresizeBehavior: typeof import('@servicenow/behavior-resize'),\n\t\t\trtlBehavior: typeof import('@servicenow/behavior-rtl')\n\t\t}\n\t},\n\tt: typeof import(\"sn-translate\").t,\n\tactionTypes: typeof import('@servicenow/ui-core').actionTypes,\n\tcreateRef: typeof import('@servicenow/ui-renderer-snabbdom').createRef,\n\tcreateElement: typeof import('@servicenow/ui-renderer-snabbdom').createElement,\n\tcreateJSXElement(tag: string, props?: any, ...children: Array<any>): any,\n\tFragment: typeof import('@servicenow/ui-renderer-snabbdom').Fragment,\n\tcreateHttpEffect: typeof import('@servicenow/ui-effect-http').createHttpEffect,\n\tcreateGraphQLEffect: typeof import('@servicenow/ui-effect-graphql').createGraphQLEffect,\n\tcreateAmbSubscriptionEffect: typeof import('@servicenow/ui-effect-amb').createAmbSubscriptionEffect,\n\tcreateAmbEventEffect: typeof import('@servicenow/ui-effect-amb').createAmbEventEffect,\n\tcreateAmbPublishEffect: typeof import('@servicenow/ui-effect-amb').createAmbPublishEffect,\n\tgetTemplates: typeof import('uxf-template-loader').getTemplates,\n\tgetComponentsBySysIds: typeof import('uxf-template-loader').getComponentsBySysIds,\n\tgetComponentsByTagNames: typeof import('uxf-template-loader').getComponentsByTagNames,\n\tcreateCustomElement: typeof import('@servicenow/ui-core').createCustomElement\n}>;\nimport react from 'react';\nimport './moduleFormat';\n\ndeclare global {\n\tinterface ActionTypes<T = any> {\n\t\t'NOW_ALERT#ACTION_CLICKED': { action: { type: 'dismiss' } },\n\t\t'NOW_ALERT#EXPANDED_SET': { value: boolean },\n\t\t'NOW_ALERT#TEXT_LINK_CLICKED': Record<string, any>,\n\n\t\t'NOW_ALERT_LIST#ITEMS_SET': { value: Array<NowAlertItem> },\n\t\t'NOW_ALERT_LIST#ITEM_ACTION_CLICKED': { item: NowAlertItem },\n\t\t'NOW_ALERT_LIST#ITEM_TEXT_LINK_CLICKED': { item: NowAlertItem },\n\n\t\t'NOW_BUTTON#CLICKED': Record<string, any>,\n\t\t'NOW_BUTTON_BARE#CLICKED': Record<string, any>,\n\t\t'NOW_BUTTON_ICONIC#CLICKED': Record<string, any>,\n\t\t'NOW_BUTTON_STATEFUL#SELECTED_SET': Record<string, any>,\n\n\t\t'NOW_CARD#CLICKED': Record<string, any>,\n\t\t'NOW_CARD#SELECTED_SET': { value: boolean },\n\n\t\t'NOW_CARD_ACTIONS#ACTION_CLICKED': T,\n\n\t\t'NOW_CARD_HEADER#ACTION_CLICKED': T,\n\n\t\t'NOW_CONTENT_TREE#ACTIONABLE_ITEM_CLICKED': T,\n\t\t'NOW_CONTENT_TREE#ACTION_CLICKED': T,\n\t\t'NOW_CONTENT_TREE#ACTION_MOUSEENTER': T,\n\t\t'NOW_CONTENT_TREE#ACTION_MOUSELEAVE': T,\n\t\t'NOW_CONTENT_TREE#EXPANDED_ITEMS_SET': T,\n\t\t'NOW_CONTENT_TREE#ITEM_CLICKED': T,\n\t\t'NOW_CONTENT_TREE#LOADING_CANCELLED': T,\n\t\t'NOW_CONTENT_TREE#LOADING_REQUESTED': T,\n\t\t'NOW_CONTENT_TREE#SELECTED_ITEMS_SET': T,\n\n\t\t'NOW_DROPDOWN#ITEM_CLICKED': T,\n\t\t'NOW_DROPDOWN#OPENED_SET': T,\n\t\t'NOW_DROPDOWN#SELECTED_ITEMS_SET': T,\n\n\t\t'NOW_LOADER#ACTION_CLICKED': T,\n\n\t\t'NOW_MODAL#FOOTER_ACTION_CLICKED': T,\n\t\t'NOW_MODAL#OPENED_SET': T,\n\n\t\t'NOW_PILL#DISMISSED': T,\n\t\t'NOW_PILL#SELECTED_SET': T,\n\n\t\t'NOW_SPLIT_BUTTON#ACTION_CLICKED': T,\n\t\t'NOW_SPLIT_BUTTON#ITEM_CLICKED': T,\n\t\t'NOW_SPLIT_BUTTON#OPENED_SET': T,\n\n\t\t'NOW_TABS#SELECTED_ITEM_SET': T,\n\n\t\t'NOW_TEMPLATE_CARD_ASSIST#SELECTED_SET': T,\n\n\t\t'NOW_TEMPLATE_CARD_ATTACHMENT#ACTION_CLICKED': T,\n\n\t\t'NOW_TEXT_LINK#CLICKED': T,\n\n\t\t'NOW_TOGGLE#CHECKED_SET': T,\n\n\t\t'NOW_DROPDOWN_PANEL#ITEM_CLICKED': T,\n\t\t'NOW_DROPDOWN_PANEL#OPENED_SET': T,\n\t\t'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': T,\n\n\t\t'NOW_INPUT#INVALID_SET': T,\n\t\t'NOW_INPUT#VALUE_SET': T,\n\n\n\t\t'NOW_INPUT_PASSWORD#INVALID_SET': T,\n\t\t'NOW_INPUT_PASSWORD#VALUE_SET': T,\n\n\t\t'NOW_INPUT_PHONE#BUTTON_CLICKED': T,\n\t\t'NOW_INPUT_PHONE#COUNTRY_CODE_SET': T,\n\t\t'NOW_INPUT_PHONE#INVALID_SET': T,\n\t\t'NOW_INPUT_PHONE#VALUE_SET': T,\n\n\t\t'NOW_INPUT_URL#INVALID_SET': T,\n\n\t\t'NOW_RADIO_BUTTONS#VALUE_SET': T,\n\n\t\t'NOW_SCORE#CLICKED': T,\n\n\t\t'NOW_STEPPER#NEXT_PAGE_BUTTON_CLICKED': T,\n\n\t\t'NOW_TEXTAREA#INVALID_SET': T,\n\t\t'NOW_TEXTAREA#VALUE_SET': T,\n\n\t\t'NOW_RADIO_GROUP#VALUE_CHANGED': T,\n\n\t\t'NOW_RECORD_CHECKBOX#VALUE_CHANGED': T,\n\n\t\t'PREVIEW_RECORD': T,\n\n\t\t'NOW_RECORD_COMMON_SIDEBAR#OPENED_SET': T,\n\n\t\t'NOW_RECORD_UI_ACTION_BAR#CLICKED': T,\n\n\t\t'NOW_RECORD_DATE_PICKER#STAGED_VALUE_CHANGED': T,\n\t\t'NOW_RECORD_DATE_PICKER#VALUE_CHANGED': T,\n\n\t\t'NOW_RECORD_FILE_ATTACHMENT#VALUE_CHANGED': T,\n\n\t\t'NOW_RECORD_HTML_EDITOR#STAGED_VALUE_CHANGED': T,\n\t\t'NOW_RECORD_HTML_EDITOR#VALUE_CHANGED': T,\n\n\t\t'NOW_RECORD_IP_ADDRESS#STAGED_VALUE_CHANGED': T,\n\t\t'NOW_RECORD_IP_ADDRESS#VALUE_CHANGED': T\n\t\t//[key: string]: any;\n\t}\n\tinterface ActionTypes {\n\t\tunknown: any;\n\t}\n\tinterface LifeCycleActionPayload {\n\t\thost: HTMLElement\n\t}\n\tinterface PropChangeActionPayload extends LifeCycleActionPayload {\n\t\tname: string,\n\t\tpreviousValue: any,\n\t\tvalue: any\n\t}\n\tinterface ErrorThrownActionPayload extends LifeCycleActionPayload {\n\t\tlocation: string,\n\t\terror: string,\n\t\tdetails: string\n\t}\n\tinterface ActionTypes {\n\t\t'SEISMIC_COMPONENT_CONNECTED': LifeCycleActionPayload\n\t\t'SEISMIC_COMPONENT_DISCONNECTED': LifeCycleActionPayload,\n\t\t'SEISMIC_COMPONENT_BOOTSTRAPPED': LifeCycleActionPayload,\n\t\t'SEISMIC_COMPONENT_PROPERTY_CHANGED': PropChangeActionPayload,\n\t\t'SEISMIC_COMPONENT_RENDERED': LifeCycleActionPayload,\n\t\t'SEISMIC_COMPONENT_ERROR_THROWN': ErrorThrownActionPayload,\n\t\t'SEISMIC_COMPONENT_DOM_READY': LifeCycleActionPayload\n\t}\n\tinterface LifeCycleActionTypes {\n\t\treadonly 'COMPONENT_CONNECTED': 'SEISMIC_COMPONENT_CONNECTED',\n\t\treadonly 'COMPONENT_DISCONNECTED': 'SEISMIC_COMPONENT_DISCONNECTED',\n\t\treadonly 'COMPONENT_BOOTSTRAPPED': 'SEISMIC_COMPONENT_BOOTSTRAPPED',\n\t\treadonly 'COMPONENT_PROPERTY_CHANGED': 'SEISMIC_COMPONENT_PROPERTY_CHANGED',\n\t\treadonly 'COMPONENT_RENDERED': 'SEISMIC_COMPONENT_RENDERED',\n\t\treadonly 'COMPONENT_ERROR_THROWN': 'SEISMIC_COMPONENT_ERROR_THROWN',\n\t\treadonly 'COMPONENT_DOM_READY': 'SEISMIC_COMPONENT_DOM_READY'\n\t}\n\n\ttype UNKNOWN_ACTION = 'unknown';\n\tinterface Window {\n\t\tdefine(moduleId: string, deps: Array<string>, ready: Function): void,\n\t\tsnc: typeof snc,\n\t//\tcomponentStyle: string;\n\t//\tprovideComponentStyle(): string;\n\t//\tpreloadComponents?(): Array<string>,\n\t}\n\t//const createCustomElement: typeof snc.createCustomElement;\n\t//const componentStyle: string;\n\n\tinterface VNode {\n\t\telm: Node | undefined\n\t}\n\ttype HookInitHandler = (vNode?: VNode) => void;\n\ttype HookInsertHandler = (vNode?: VNode) => void;\n\ttype HookUpdateHandler = (oldVNode?: VNode, vNode?: VNode) => void;\n\ttype HookRemoveHandler = (vNode?: VNode, callback?: (...args) => void) => void;\n\ttype HookDestroyHandler = (vNode?: VNode) => void;\n}\n\n\ndeclare module 'react' {\n\tinterface DOMAttributes<T> {\n\t\tid?: string,\n\t\tslot?: string,\n\t\tattrs?: Record<string, any>,\n\t\tappendToPayload?: Record<string, any>,\n\t\thookInsert?: HookInsertHandler,\n\t\thookInit?: HookInitHandler,\n\t\thookUpdate?: HookUpdateHandler,\n\t\thookRemove?: HookRemoveHandler,\n\t\thookDestroy?: HookDestroyHandler,\n\t\t'hook-init'?: HookInitHandler,\n\t\t'hook-insert'?: HookInsertHandler,\n\t\t'hook-update'?: HookUpdateHandler,\n\t\t'hook-remove'?: HookRemoveHandler,\n\t\t'hook-destroy'?: HookDestroyHandler,\n\t\thook?: {\n\t\t\tinit?: HookInitHandler\n\t\t\tinsert?: HookInsertHandler,\n\t\t\tupdate?: HookUpdateHandler,\n\t\t\tremove?: HookRemoveHandler,\n\t\t\tdestroy?: HookDestroyHandler\n\t\t},\n\t\ton?: Partial<{ [P in keyof DocumentEventMap]: (e: DocumentEventMap[P]) => void; }>\n\t\t// Clipboard Events\n\t\t'on-copy'?: ClipboardEventHandler<T>;\n\t\t'on-copycapture'?: ClipboardEventHandler<T>;\n\t\t'on-cut'?: ClipboardEventHandler<T>;\n\t\t'on-cutcapture'?: ClipboardEventHandler<T>;\n\t\t'on-paste'?: ClipboardEventHandler<T>;\n\t\t'on-pastecapture'?: ClipboardEventHandler<T>;\n\n\t\t// Composition Events\n\t\t'on-compositionend'?: CompositionEventHandler<T>;\n\t\t'on-compositionendcapture'?: CompositionEventHandler<T>;\n\t\t'on-compositionstart'?: CompositionEventHandler<T>;\n\t\t'on-compositionstartcapture'?: CompositionEventHandler<T>;\n\t\t'on-compositionupdate'?: CompositionEventHandler<T>;\n\t\t'on-compositionupdatecapture'?: CompositionEventHandler<T>;\n\n\t\t// Focus Events\n\t\t'on-focus'?: FocusEventHandler<T>;\n\t\t'on-focuscapture'?: FocusEventHandler<T>;\n\t\t'on-blur'?: FocusEventHandler<T>;\n\t\t'on-blurcapture'?: FocusEventHandler<T>;\n\n\t\t// Form Events\n\t\t'on-change'?: FormEventHandler<T>;\n\t\t'on-changecapture'?: FormEventHandler<T>;\n\t\t'on-beforeinput'?: FormEventHandler<T>;\n\t\t'on-beforeinputcapture'?: FormEventHandler<T>;\n\t\t'on-input'?: FormEventHandler<T>;\n\t\t'on-inputcapture'?: FormEventHandler<T>;\n\t\t'on-reset'?: FormEventHandler<T>;\n\t\t'on-resetcapture'?: FormEventHandler<T>;\n\t\t'on-submit'?: FormEventHandler<T>;\n\t\t'on-submitcapture'?: FormEventHandler<T>;\n\t\t'on-invalid'?: FormEventHandler<T>;\n\t\t'on-invalidcapture'?: FormEventHandler<T>;\n\n\t\t// Image Events\n\t\t'on-load'?: ReactEventHandler<T>;\n\t\t'on-loadcapture'?: ReactEventHandler<T>;\n\t\t'on-error'?: ReactEventHandler<T>; // also a Media Event\n\t\t'on-errorcapture'?: ReactEventHandler<T>; // also a Media Event\n\n\t\t// Keyboard Events\n\t\t'on-keydown'?: KeyboardEventHandler<T>;\n\t\t'on-keydowncapture'?: KeyboardEventHandler<T>;\n\t\t'on-keypress'?: KeyboardEventHandler<T>;\n\t\t'on-keypresscapture'?: KeyboardEventHandler<T>;\n\t\t'on-keyup'?: KeyboardEventHandler<T>;\n\t\t'on-keyupcapture'?: KeyboardEventHandler<T>;\n\n\t\t// Media Events\n\t\t'on-abort'?: ReactEventHandler<T>;\n\t\t'on-abortcapture'?: ReactEventHandler<T>;\n\t\t'on-canplay'?: ReactEventHandler<T>;\n\t\t'on-canplaycapture'?: ReactEventHandler<T>;\n\t\t'on-canplaythrough'?: ReactEventHandler<T>;\n\t\t'on-canplaythroughcapture'?: ReactEventHandler<T>;\n\t\t'on-durationchange'?: ReactEventHandler<T>;\n\t\t'on-durationchangecapture'?: ReactEventHandler<T>;\n\t\t'on-emptied'?: ReactEventHandler<T>;\n\t\t'on-emptied-capture'?: ReactEventHandler<T>;\n\t\t'on-encrypted'?: ReactEventHandler<T>;\n\t\t'on-encryptedcapture'?: ReactEventHandler<T>;\n\t\t'on-ended'?: ReactEventHandler<T>;\n\t\t'on-endedcapture'?: ReactEventHandler<T>;\n\t\t'on-loadeddata'?: ReactEventHandler<T>;\n\t\t'on-loadeddatacapture'?: ReactEventHandler<T>;\n\t\t'on-loadedmetadata'?: ReactEventHandler<T>;\n\t\t'on-loadedmetadatacapture'?: ReactEventHandler<T>;\n\t\t'on-loadstart'?: ReactEventHandler<T>;\n\t\t'on-loadstartcapture'?: ReactEventHandler<T>;\n\t\t'on-pause'?: ReactEventHandler<T>;\n\t\t'on-pause-capture'?: ReactEventHandler<T>;\n\t\t'on-play'?: ReactEventHandler<T>;\n\t\t'on-playcapture'?: ReactEventHandler<T>;\n\t\t'on-playing'?: ReactEventHandler<T>;\n\t\t'on-playingcapture'?: ReactEventHandler<T>;\n\t\t'on-progress'?: ReactEventHandler<T>;\n\t\t'on-progress-capture'?: ReactEventHandler<T>;\n\t\t'on-ratechange'?: ReactEventHandler<T>;\n\t\t'on-ratechangecapture'?: ReactEventHandler<T>;\n\t\t'on-seeked'?: ReactEventHandler<T>;\n\t\t'on-seekedcapture'?: ReactEventHandler<T>;\n\t\t'on-seeking'?: ReactEventHandler<T>;\n\t\t'on-seekingcapture'?: ReactEventHandler<T>;\n\t\t'on-stalled'?: ReactEventHandler<T>;\n\t\t'on-stalledcapture'?: ReactEventHandler<T>;\n\t\t'on-suspend'?: ReactEventHandler<T>;\n\t\t'on-suspend-capture'?: ReactEventHandler<T>;\n\t\t'on-timeupdate'?: ReactEventHandler<T>;\n\t\t'on-timeupdatecapture'?: ReactEventHandler<T>;\n\t\t'on-volumechange'?: ReactEventHandler<T>;\n\t\t'on-volumechangecapture'?: ReactEventHandler<T>;\n\t\t'on-waiting'?: ReactEventHandler<T>;\n\t\t'on-waitingcapture'?: ReactEventHandler<T>;\n\n\t\t// MouseEvents\n\t\t'on-auxclick'?: MouseEventHandler<T>;\n\t\t'on-auxclickcapture'?: MouseEventHandler<T>;\n\t\t'on-click'?: MouseEventHandler<T>;\n\t\t'on-clickcapture'?: MouseEventHandler<T>;\n\t\t'on-contextmenu'?: MouseEventHandler<T>;\n\t\t'on-contextmenucapture'?: MouseEventHandler<T>;\n\t\t'on-doubleclick'?: MouseEventHandler<T>;\n\t\t'on-doubleclickcapture'?: MouseEventHandler<T>;\n\t\t'on-drag'?: DragEventHandler<T>;\n\t\t'on-dragcapture'?: DragEventHandler<T>;\n\t\t'on-dragend'?: DragEventHandler<T>;\n\t\t'on-dragendcapture'?: DragEventHandler<T>;\n\t\t'on-dragenter'?: DragEventHandler<T>;\n\t\t'on-dragentercapture'?: DragEventHandler<T>;\n\t\t'on-dragexit'?: DragEventHandler<T>;\n\t\t'on-dragexitcapture'?: DragEventHandler<T>;\n\t\t'on-dragleave'?: DragEventHandler<T>;\n\t\t'on-dragleavecapture'?: DragEventHandler<T>;\n\t\t'on-dragover'?: DragEventHandler<T>;\n\t\t'on-dragovercapture'?: DragEventHandler<T>;\n\t\t'on-dragstart'?: DragEventHandler<T>;\n\t\t'on-Dragstartcapture'?: DragEventHandler<T>;\n\t\t'on-drop'?: DragEventHandler<T>;\n\t\t'on-dropcapture'?: DragEventHandler<T>;\n\t\t'on-mousedown'?: MouseEventHandler<T>;\n\t\t'on-mousedowncapture'?: MouseEventHandler<T>;\n\t\t'on-mouseenter'?: MouseEventHandler<T>;\n\t\t'on-mouseleave'?: MouseEventHandler<T>;\n\t\t'on-mousemove'?: MouseEventHandler<T>;\n\t\t'on-mousemovecapture'?: MouseEventHandler<T>;\n\t\t'on-mouseout'?: MouseEventHandler<T>;\n\t\t'on-mouseoutcapture'?: MouseEventHandler<T>;\n\t\t'on-mouseover'?: MouseEventHandler<T>;\n\t\t'on-mouseovercapture'?: MouseEventHandler<T>;\n\t\t'on-mouseup'?: MouseEventHandler<T>;\n\t\t'on-mouseupcapture'?: MouseEventHandler<T>;\n\n\t\t// Selection Events\n\t\t'on-select'?: ReactEventHandler<T>;\n\t\t'on-selectcapture'?: ReactEventHandler<T>;\n\n\t\t// Touch Events\n\t\t'on-touchcancel'?: TouchEventHandler<T>;\n\t\t'on-touchcancelcapture'?: TouchEventHandler<T>;\n\t\t'on-touchend'?: TouchEventHandler<T>;\n\t\t'on-touchendcapture'?: TouchEventHandler<T>;\n\t\t'on-touchmove'?: TouchEventHandler<T>;\n\t\t'on-touchmovecapture'?: TouchEventHandler<T>;\n\t\t'on-touchstart'?: TouchEventHandler<T>;\n\t\t'on-touchstartcapture'?: TouchEventHandler<T>;\n\n\t\t// Pointer Events\n\t\t'on-pointerdown'?: PointerEventHandler<T>;\n\t\t'on-pointerdowncapture'?: PointerEventHandler<T>;\n\t\t'on-pointermove'?: PointerEventHandler<T>;\n\t\t'on-pointermovecapture'?: PointerEventHandler<T>;\n\t\t'on-pointerup'?: PointerEventHandler<T>;\n\t\t'on-pointerupcapture'?: PointerEventHandler<T>;\n\t\t'on-pointercancel'?: PointerEventHandler<T>;\n\t\t'on-pointercancelcapture'?: PointerEventHandler<T>;\n\t\t'on-pointerenter'?: PointerEventHandler<T>;\n\t\t'on-pointerentercapture'?: PointerEventHandler<T>;\n\t\t'on-pointerleave'?: PointerEventHandler<T>;\n\t\t'on-pointerleavecapture'?: PointerEventHandler<T>;\n\t\t'on-pointerover'?: PointerEventHandler<T>;\n\t\t'on-pointerovercapture'?: PointerEventHandler<T>;\n\t\t'on-pointerout'?: PointerEventHandler<T>;\n\t\t'on-pointeroutcapture'?: PointerEventHandler<T>;\n\t\t'on-gotpointercapture'?: PointerEventHandler<T>;\n\t\t'on-gotpointercapturecapture'?: PointerEventHandler<T>;\n\t\t'on-lostpointercapture'?: PointerEventHandler<T>;\n\t\t'on-lostpointercapturecapture'?: PointerEventHandler<T>;\n\n\t\t// UI Events\n\t\t'on-scroll'?: UIEventHandler<T>;\n\t\t'on-scrollcapture'?: UIEventHandler<T>;\n\n\t\t// Wheel Events\n\t\t'on-wheel'?: WheelEventHandler<T>;\n\t\t'on-wheelcapture'?: WheelEventHandler<T>;\n\n\t\t// Animation Events\n\t\t'on-animationstart'?: AnimationEventHandler<T>;\n\t\t'on-animationstartcapture'?: AnimationEventHandler<T>;\n\t\t'on-animationend'?: AnimationEventHandler<T>;\n\t\t'on-animationendcapture'?: AnimationEventHandler<T>;\n\t\t'on-animationiteration'?: AnimationEventHandler<T>;\n\t\t'on-animationiterationcapture'?: AnimationEventHandler<T>;\n\n\t\t// Transition Events\n\t\t'on-transitionend'?: TransitionEventHandler<T>;\n\t\t'on-transitionendcapture'?: TransitionEventHandler<T>;\n\t}\n}\n\n\ndeclare global {\n\n\tinterface NowAlertItem {\n\t\taction?: { type: 'dismiss' | 'acknowledge' | 'open', href?: string }\n\t\tcontent?: string,\n\t\texpanded?: boolean,\n\t\theader?: string,\n\t\ticonName?: string,\n\t\tlinkHref?: string,\n\t\tlinkText?: string,\n\t\tmanageExpanded?: boolean,\n\t\tstatus?: 'critical' | 'high' | 'moderate' | 'warning' | 'info' | 'positive' | 'low' | 'info',\n\t\tvariant?: string,//'critical' | 'high' | 'moderate' | 'warning' | 'info' | 'positive' | 'low' | 'info',\n\t\ttextLinkProps?: { label: string, href: string }\n\t}\n\tnamespace JSX {\n\t\tinterface NowCalendarAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tstyle?: { height: string, display: string },\n\t\t\tdir?: string,\n\t\t\tavailableViews?: Array<string>\n\t\t}\n\t\tinterface NowAlertAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T>, NowAlertItem {\n\t\t}\n\t\tinterface NowAlertListAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tconfigAriaLive?: 'polite' | 'off' | 'assertive',\n\t\t\titems: Array<NowAlertItem>,\n\t\t\tmanageItems?: boolean\n\t\t}\n\t\ttype ElementSize = 'sm' | 'md' | 'lg';\n\t\ttype VariantType = 'primary' | 'secondary';\n\t\ttype ButtonVariant = 'primary' | 'primary-positive' | 'primary-negative' | 'secondary' | 'secondary-positive' | 'secondary-negative' | 'tertiary' | 'inherit';\n\t\tinterface NowAvatarAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tariaHidden?: string,\n\t\t\timageSrc?: string,\n\t\t\tpresence?: 'available' | 'busy' | 'away' | 'offline',\n\t\t\tsize?: ElementSize,\n\t\t\tuserName?: string\n\t\t}\n\t\tinterface NowBadgeAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tvariant?: VariantType,\n\t\t\tvalue: number | string,\n\t\t\tstatus?: 'critical' | 'high' | 'warning' | 'moderate' | 'info' | 'positive' | 'low',\n\t\t\tsize: ElementSize,\n\t\t\tround?: boolean,\n\t\t\tmaxDigits?: number | string\n\t\t}\n\t\tinterface NowButtonAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcta?: string,\n\t\t\ticonName?: string,\n\t\t\ticonSet?: string,\n\t\t\tlabel?: string,\n\t\t\tsize?: ElementSize,\n\t\t\tvariant?: ButtonVariant,\n\t\t\ticon?: string,\n\t\t\tdisabled?: boolean,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\ttooltipContent?: string,\n\t\t\tbare?: boolean,\n\t\t\tinherit?: boolean\n\t\t}\n\t\tinterface NowButtonBareAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tdisabled?: boolean,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\thidePadding?: boolean,\n\t\t\thighContrast?: boolean,\n\t\t\ticonEnd?: string,\n\t\t\ticonStart?: string,\n\t\t\tlabel?: string,\n\t\t\tsize?: ElementSize,\n\t\t\tvariant?: VariantType\n\t\t}\n\t\tinterface NowButtonIconicAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\ticon?: string,\n\t\t\tsize?: ElementSize,\n\t\t\ttooltipContent?: string,\n\t\t\tvariant?: 'primary' | 'secondary' | 'tertiary',\n\t\t\tbare?: boolean,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tdisabled?: boolean,\n\t\t\thidePadding?: boolean,\n\t\t\thighContrast?: boolean\n\t\t}\n\t\tinterface NowButtonStatefulAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\ticon?: string,\n\t\t\tvariant?: 'primary' | 'primary-highlighted' | 'secondary' | 'secondary-highlighted' | 'tertiary',\n\t\t\ttooltipContent?: string,\n\t\t\tsize?: ElementSize,\n\t\t\tselected?: boolean,\n\t\t\tmanageSelected?: boolean,\n\t\t\thighContrast?: boolean,\n\t\t\thidePadding?: boolean,\n\t\t\tdisabled?: boolean,\n\t\t\tconfigRole?: 'button' | 'radio' | 'tab',\n\t\t\tconfigAria?: Record<string, string>\n\t\t}\n\t\ttype NowElement<T> = React.DetailedHTMLProps<T, HTMLElement>\n\t\tinterface NowCardAttributes extends React.AriaAttributes, React.DOMAttributes<HTMLElement> {\n\t\t\tconfigArial?: Record<string, string>,\n\t\t\tinteraction?: 'none' | 'click' | 'select',\n\t\t\tmanageSelected?: boolean,\n\t\t\tslected?: boolean,\n\t\t\tsize?: ElementSize\n\t\t}\n\t\tinterface NowCardActionItem {\n\t\t\tlabel?: string,\n\t\t\ticon?: string,\n\t\t\tvariant?: ButtonVariant,\n\t\t\tdisabled?: boolean,\n\t\t\tclickActionType?: string\n\t\t}\n\t\tinterface NowCardActionsAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\titems?: Array<NowCardActionItem>\n\t\t}\n\t\tinterface NowCardFooterAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tlabel?: string | { start: string, end: string },\n\t\t\tsplit?: 'equal' | 'unequal'\n\t\t}\n\t\tinterface NowCardHeaderAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tactions?: Array<Partial<{ id?: string, icon: string, label: string, disabled: boolean, clickActionType: string }>>,\n\t\t\tcaption?: Partial<{ label: string, lines: number, size: ElementSize }>\n\t\t\tdropdowns?: Array<{ id: string, items: Array<{ id: string, label: string }> }>,\n\t\t\theading?: Partial<{ label: string, lines: number, level?: number, size: ElementSize, variant: ButtonVariant }>,\n\t\t\ttagline?: Partial<{ label: string, icon: string, variant: 'secondary' | 'tertiary' }>\n\t\t}\n\t\tinterface NowContentTreeAction {\n\t\t\ticon: string,\n\t\t\tlabel: string,\n\t\t\tclickActionType: string,\n\t\t\tmouseenterActionType: string,\n\t\t\tmouseleaveActionType: string,\n\t\t}\n\t\tinterface NowContentTreeHightlightedValue {\n\t\t\tlabel: string,\n\t\t\tstatus: string,\n\t\t\twidht: string,\n\t\t}\n\t\tinterface NowContentTreeIdentifier {\n\t\t\ttype: 'icon' | 'avatar',\n\t\t\ticon: string,\n\t\t\tuserName: string,\n\t\t\timageSrc: string,\n\t\t\tariaHidden: string\n\t\t}\n\n\t\tinterface NowContentTreeItem {\n\t\t\tid: string,\n\t\t\tlabel: string,\n\t\t\tchildren: Array<Partial<NowContentTreeItem>>,\n\t\t\tchildrenAvailable: number,\n\t\t\tidentifierProps: Partial<NowContentTreeIdentifier>,\n\t\t\tactionable: boolean,\n\t\t\tactions: Array<Partial<NowContentTreeAction>>,\n\t\t\thighlightedValueProps: Array<Partial<NowContentTreeHightlightedValue>>,\n\t\t\tdisabled: boolean\n\t\t}\n\t\tinterface NowContentTreeAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tshowDividers?: boolean,\n\t\t\tselect?: 'single' | 'multi' | 'none',\n\t\t\titems?: Array<Partial<NowContentTreeItem>>,\n\t\t\tloadingItems?: Array<{ path?: Array<string>, error?: Array<any>, erroMessage?: string }>,\n\t\t\tmanageExpandedItems?: boolean,\n\t\t\texpandedItems?: Array<string>,\n\t\t\tselectedItems?: Array<Array<string>>,\n\t\t\tmanageSelectedItems?: boolean\n\t\t\tsearchTerm?: string,\n\n\t\t}\n\t\tinterface NowDropdownItem {\n\t\t\tid?: string | number,\n\t\t\tlabel: string,\n\t\t\tcount?: number,\n\t\t\ticon?: string,\n\t\t\tpresence?: 'available' | 'away' | 'busy' | 'offline',\n\t\t\tdisabled?: boolean\n\t\t}\n\t\tinterface NowDropdownSection {\n\t\t\tid?: string | number,\n\t\t\tlabel?: string,\n\t\t\tchildren?: Array<Partial<NowDropdownItem>>,\n\t\t}\n\t\tinterface NowDropdownAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tbare?: boolean,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tdisabled?: boolean,\n\t\t\thideCaret?: boolean,\n\t\t\thideLabel?: boolean,\n\t\t\ticon?: string,\n\t\t\titems?: Array<Partial<NowDropdownItem | NowDropdownSection>>,\n\t\t\tmanageOpended?: boolean,\n\t\t\tmanageSelectedItems?: boolean,\n\t\t\topened?: boolean,\n\t\t\tpanelFitProps?: { position?: Array<string>, container?: HTMLElement, constrain: Object },\n\t\t\tplaceholder?: string,\n\t\t\tselect?: 'single' | 'multi' | 'none',\n\t\t\tselectedItems?: Array<Array<string>>,\n\t\t\tshowPadding?: boolean,\n\t\t\tsize?: ElementSize,\n\t\t\ttoooltipContent?: string,\n\t\t\tvariant?: 'primary' | 'secondary' | 'secondary-selected' | 'tertiary' | 'tertiary-selected' | 'inherit'\n\t\t}\n\t\tinterface NowHeadingAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\thasNoMargin?: boolean,\n\t\t\tlabel?: string,\n\t\t\tlevel?: string | number,\n\t\t\tvariant?: 'header-primary' | 'header-secondary' | 'header-tertiary' | 'title-primary' | 'title-secondary' | 'title-tertiary',\n\t\t\twontWrap?: boolean,\n\t\t\tpurpose: string,\n\n\t\t}\n\t\tinterface NowHighlightedValueAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tlabel?: string,\n\t\t\tshowIcon?: boolean,\n\t\t\tstatus?: 'critical' | 'high' | 'warning' | 'moderate' | 'positive' | 'info' | 'low'\n\t\t}\n\t\tinterface NowIconAttriutes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\ticon?: string,\n\t\t\tsize?: ElementSize | 'x1',\n\t\t\tspin?: boolean\n\t\t}\n\t\tinterface NowIconPresenceAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\taccessibilityMode?: boolean,\n\t\t\tpresence?: 'available' | 'busy' | 'away' | 'offline',\n\t\t\tsize?: ElementSize | 'x1'\n\t\t}\n\t\tinterface NowImageAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\talt?: string,\n\t\t\tsrc?: string,\n\t\t\theight?: number | string,\n\t\t\twidth?: number | string,\n\t\t\tfit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',\n\t\t\tposition?: any,\n\t\t\tsources?: Array<{ srcset?: string, type: string, media?: string, sizes?: string }>\n\t\t}\n\n\t\tinterface NowLabelValueInlineAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tlabel?: string,\n\t\t\treversed?: boolean,\n\t\t\ttruncated?: boolean,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowLabelValueStackedAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\talign?: 'vertical' | 'horizontal' | 'horizontal-equal',\n\t\t\tdelimiter?: string,\n\t\t\titemMinWidth?: string,\n\t\t\titems?: Array<{ label: string, value: any }>,\n\t\t\tsize?: ElementSize,\n\t\t\ttruncated?: boolean,\n\t\t\twrapped?: boolean\n\t\t}\n\t\tinterface NowLabelHighlightedStringType {\n\t\t\ttype?: 'string',\n\t\t\tvalue?: string,\n\t\t\tprevious?: string\n\t\t}\n\t\tinterface NowLabelHighlightedValueType {\n\t\t\ttype?: 'highlighted-value',\n\t\t\tlabel?: string,\n\t\t\tstatus?: string,\n\t\t\tshowIcon?: boolean\n\t\t}\n\t\tinterface NowLabelHightlightedTextLinkType {\n\t\t\ttype?: 'text-link',\n\t\t\tlabel?: string,\n\t\t\thref?: string,\n\t\t\tvariant?: string,\n\t\t\tunderlined?: boolean,\n\t\t\topensWindow?: boolean\n\t\t}\n\t\tinterface NowLabelHightligtedJSXType {\n\t\t\ttype?: 'jsx',\n\t\t\tvalue?: any,\n\t\t\tprevious?: any\n\t\t}\n\t\tinterface NowLabelHighlightedHTMLType {\n\t\t\ttype?: 'html',\n\t\t\tvalue?: string,\n\t\t\tprevious?: string\n\t\t}\n\t\tinterface NowLabelValueTabbedAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tdelimiter?: boolean,\n\t\t\titems?: Array<NowLabelHighlightedStringType | NowLabelHighlightedValueType | NowLabelHightlightedTextLinkType | NowLabelHightligtedJSXType | NowLabelHighlightedHTMLType>\n\t\t\tsize?: ElementSize,\n\t\t\talign?: string\n\t\t}\n\n\t\tinterface NowLoaderAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tlabel?: string,\n\t\t\taction?: string,\n\t\t\tsize?: ElementSize\n\t\t}\n\t\tinterface NowModalAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcontent?: string,\n\t\t\tcontentFullWidth?: boolean,\n\t\t\tfooterActions?: Array<{ label?: string, variant?: string, disabled?: boolean, clickActionType?: string }>,\n\t\t\theaderLabel?: string,\n\t\t\theaderLevel?: string,\n\t\t\tmanageOpened?: boolean,\n\t\t\topened?: boolean,\n\t\t\tsize?: ElementSize\n\t\t}\n\t\tinterface NowPillAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcanDismiss?: boolean,\n\t\t\ticon?: string,\n\t\t\timageSrc?: string,\n\t\t\tlabel?: string,\n\t\t\tmanageSelected?: boolean,\n\t\t\tselected?: boolean,\n\t\t\tsize?: ElementSize\n\t\t}\n\t\tinterface NowProgressBarAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tconfigAria?: Record<string, string>\n\t\t\tmax?: number,\n\t\t\tpathType?: 'initial' | 'alert' | 'error' | 'inactive',\n\t\t\tsize?: ElementSize | 'xs',\n\t\t\tvalue?: number | string\n\t\t}\n\t\tinterface NowRichTextAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\thtml?: string\n\t\t}\n\t\tinterface NowSplitButtonAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tconfigAriaAction?: Record<string, string>,\n\t\t\tconfigAriaTrigger?: Record<string, string>,\n\t\t\tdisabled?: boolean,\n\t\t\ticon?: string,\n\t\t\titems?: Array<NowDropdownItem | NowDropdownSection>,\n\t\t\tlabel?: string,\n\t\t\tmanageOpened?: boolean,\n\t\t\topened?: boolean,\n\t\t\tsize?: ElementSize,\n\t\t\tvariant?: ButtonVariant,\n\t\t}\n\t\tinterface NowTabItem {\n\t\t\tid: string,\n\t\t\tlabel?: string,\n\t\t\ticon?: string,\n\t\t\tcount?: number,\n\t\t\tpresence?: string,\n\t\t\tdisabled?: boolean\n\t\t}\n\t\tinterface NowTabsAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tfixedWidth?: boolean,\n\t\t\thideLabel?: boolean,\n\t\t\titems: Array<NowTabItem>\n\t\t\tmanageSelectedItem?: boolean,\n\t\t\tmaxWidth?: number,\n\t\t\tselectedItem?: string\n\t\t}\n\t\tinterface NowTemplateCardAssistAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tactions?: Array<{ label?: string, id?: string }>,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tcontent?: Array<any>,\n\t\t\tfooterContent?: { label?: string, value?: string, reversed?: boolean },\n\t\t\theading?: { label?: string, value?: number | string },\n\t\t\tmanageSelected?: boolean,\n\t\t\tselected?: boolean,\n\t\t\ttagline?: { label?: string, icon?: string },\n\t\t\tcontentItemMinWidth?: string\n\t\t}\n\t\tinterface NowTemplateCardAttachmentAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tactions?: Array<{ id?: string, label?: string }>,\n\t\t\tcaption?: string,\n\t\t\theading?: { label?: string, level?: number | string },\n\t\t\tidentifier?: { type?: 'icon' | 'image', icon?: string, src?: string, alt?: string },\n\t\t}\n\t\tinterface NowTemplateCardOmniChannelAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tactions?: Array<{ label?: string, icon?: string, variant?: string, disabled?: boolean, clickActionType?: string }>,\n\t\t\tcontent?: { label?: string, value?: string },\n\t\t\theading?: { label?: string, level?: number | string },\n\t\t\ttagline?: { label?: string, icon?: string }\n\t\t}\n\t\tinterface NowTextLinkAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tdownload?: boolean | string,\n\t\t\thref?: string,\n\t\t\tlabel?: string,\n\t\t\topensWindow?: boolean,\n\t\t\tunderlined?: boolean,\n\t\t\tvariant?: 'primary' | 'secondary',\n\t\t\taccessibleLabel?: string\n\t\t}\n\t\tinterface NowToggleAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tchecked?: boolean,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tdisabled?: boolean,\n\t\t\tmanageChecked?: boolean,\n\t\t\tsize?: ElementSize\n\t\t}\n\t\ttype TOOLTIP_POSITIONS = 'top-center bottom-center' | 'bottom-center top-center' | 'center-end center-start' | 'center-start center-end' | 'top-end top-start' | 'bottom-end bottom-start' | 'top-start top-end' | 'bottom-start bottom-end';\n\t\tinterface NowTooltipAttributes<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcontainer?: HTMLElement,\n\t\t\tcontent?: string,\n\t\t\tdelay?: number | { show?: number, hide?: number },\n\t\t\tmanageOpened?: boolean,\n\t\t\topened?: boolean,\n\t\t\tposition?: Array<TOOLTIP_POSITIONS>\n\t\t}\n\t\tinterface NowCardDividerAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tfullWidth?: boolean,\n\t\t\tblockSpacing?: ElementSize | 'none'\n\t\t}\n\t\tinterface NowChartBarAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\toptions?: Record<string, any>\n\t\t}\n\t\tinterface NowCheckBoxAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tchecked?: boolean,\n\t\t\tlabel?: string,\n\t\t\trequired?: boolean,\n\t\t\tconfitAria?: Record<string, string>,\n\t\t\tdisabled?: boolean,\n\t\t\tinvalid?: boolean,\n\t\t\tmanageChecked?: boolean,\n\t\t\tname?: string,\n\t\t\treadonly?: boolean,\n\t\t\tvalue?: 'true' | 'false' | 'indeterminate',\n\t\t}\n\t\tinterface NowCollapseAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\texpanded?: boolean\n\t\t}\n\t\tinterface NowCollapseTriggerAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcontrols: string\n\t\t}\n\t\tinterface NowDropdownPanelAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tconstrain?: { minHeight?: number, minWidth?: string, maxWidth?: number, maxHeight?: number },\n\t\t\tcontainer?: HTMLElement,\n\t\t\titems?: Array<string>,\n\t\t\tmanageOpened?: boolean,\n\t\t\tmanageSelectedItems?: boolean,\n\t\t\topened?: boolean,\n\t\t\tposition?: Array<string>,\n\t\t\tslect?: 'single' | 'multi' | 'none',\n\t\t\tselectedItems?: Array<string>,\n\t\t\ttargetRef?: HTMLElement\n\t\t}\n\t\tinterface NowInputAtts<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tautofocus?: boolean,\n\t\t\tdisabled?: boolean,\n\t\t\thelperContent?: any,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tmanageInvalid?: boolean,\n\t\t\tmanageValue?: boolean,\n\t\t\tmax?: number,\n\t\t\tmaxLength?: number,\n\t\t\tmessages?: Array<{ status?: string, header?: string, content?: string, icon?: string }>,\n\t\t\tmin?: number,\n\t\t\tminLength?: number,\n\t\t\tmultiple?: boolean,\n\t\t\tname?: string,\n\t\t\toptional?: boolean,\n\t\t\tpattern?: string,\n\t\t\tplaceHolder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tstep?: number,\n\t\t\ttype?: 'email' | 'ip' | 'number' | 'text',\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowInputPasswordAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tlabel?: string,\n\t\t\tautofocus?: boolean,\n\t\t\tcompact?: boolean,\n\t\t\tdisabled?: boolean,\n\t\t\tinvalid?: boolean,\n\t\t\tmanageInvalid?: boolean,\n\t\t\tmanageValue?: boolean,\n\t\t\tmessages?: Array<{ status?: string, header?: string, content?: string, icon?: string }>,\n\t\t\tname?: string,\n\t\t\toptional?: boolean,\n\t\t\tplaceholder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\trequirements?: Array<{ label?: string, pattern?: RegExp }>\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowInputPhoneAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tautofocus?: boolean,\n\t\t\tcountryCodes?: Array<{ code: string, name: string }>,\n\t\t\tdisabled?: boolean,\n\t\t\thelperContent?: any,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tmanageInvalid?: boolean,\n\t\t\tmanageValue?: boolean,\n\t\t\tmax?: number,\n\t\t\tmaxlength?: number,\n\t\t\tmessages?: Array<{ status?: string, header?: string, content?: string, icon?: string }>,\n\t\t\tmin?: number,\n\t\t\tminlength?: number,\n\t\t\tname?: string,\n\t\t\tnumber?: string,\n\t\t\toptional?: boolean,\n\t\t\tpattern?: string,\n\t\t\tplaceholder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tselectedCountryCode?: string,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowInputUrlAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tdisabled?: boolean,\n\t\t\thelperContent?: any,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tmanageInvalid?: boolean,\n\t\t\tmanageValue?: boolean,\n\t\t\tmaxlength?: number,\n\t\t\tmessages?: Array<{ status?: string, header?: string, content?: string, icon?: string }>\n\t\t\tminlength?: number,\n\t\t\tname?: string,\n\t\t\toptional?: boolean,\n\t\t\tpattern?: string,\n\t\t\tplaceholder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowLegacyIconAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tborder?: boolean,\n\t\t\tfixedWidth?: boolean,\n\t\t\tflip?: 'horizontal' | 'vertical' | 'both',\n\t\t\tinverse?: boolean,\n\t\t\tpull?: 'left' | 'right',\n\t\t\tpulse?: boolean,\n\t\t\trotation?: '90' | '180' | '270',\n\t\t\tsize?: ElementSize | 'xs' | 'xl' | 'xxl' | 'xxxl',\n\t\t\tspin?: boolean,\n\t\t\ttransfrom?: string,\n\t\t\ttype?: string,\n\t\t\tweight?: 'regular' | 'bold' | 'strong' | 'custom'\n\t\t}\n\t\tinterface NowRadioButtonOption {\n\t\t\tid?: string,\n\t\t\tlabel?: string,\n\t\t\tchecked?: boolean,\n\t\t\treadonly?: boolean,\n\t\t\tdisabled?: boolean\n\t\t}\n\t\tinterface NowRadioButtonsAttr<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tdisabled?: boolean,\n\t\t\thelperContent?: boolean,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tlayout?: 'horizontal' | 'vertical',\n\t\t\tmanageValue?: boolean,\n\t\t\tmessages?: Array<{ status?: string, header?: string, content?: string, icon?: string }>,\n\t\t\tname?: string,\n\t\t\toptional?: boolean,\n\t\t\toptions?: Array<NowRadioButtonOption>,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowScoreAdvancedAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcanClick?: boolean,\n\t\t\tchangeInfo?: { change?: string, timestamp?: string, arrow?: string },\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\theading?: string,\n\t\t\thideWhitespace?: boolean,\n\t\t\tscore?: string,\n\t\t\tscoreSize?: string,\n\t\t\tsparkline?: any,\n\t\t\ttargetInfo?: any,\n\t\t\ttimestamp?: string,\n\t\t\tsize?: ElementSize\n\t\t}\n\t\tinterface NowScoreBasicAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcanClick?: boolean,\n\t\t\theading?: string,\n\t\t\theadingPosition?: string,\n\t\t\thideWhitespace?: boolean,\n\t\t\tscore?: string,\n\t\t\tscoreSize?: ElementSize,\n\t\t\ttimestamp?: string\n\t\t}\n\t\tinterface NowStepperItem {\n\t\t\tid?: string | number,\n\t\t\tlabel?: string,\n\t\t\ticon?: string,\n\t\t\tsubLabel?: string,\n\t\t\tprogress?: 'none' | 'partial' | 'done',\n\t\t\tdisabled?: boolean\n\t\t}\n\t\tinterface NowStepperAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\thideNumbers?: boolean,\n\t\t\titems?: Array<NowStepperItem>,\n\t\t\tmanageSelectedItem?: boolean,\n\t\t\tselctedItem?: string,\n\t\t\tshowCompletedCount?: boolean\n\t\t}\n\t\tinterface NowTextAreaAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tautofocus?: boolean,\n\t\t\tautoresize?: boolean,\n\t\t\tcols?: number,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tdisabled?: boolean,\n\t\t\thelperContent?: any,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tmanageInvalid?: boolean,\n\t\t\tmanageValue?: boolean,\n\t\t\tmaxlength?: number,\n\t\t\tmessages?: Array<{ status?: string, header?: string, content?: string, icon?: string }>,\n\t\t\tminlength?: number,\n\t\t\tname?: string,\n\t\t\toptional?: boolean,\n\t\t\tplaceholder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tresize?: 'both' | 'horizontal' | 'none' | 'vertical',\n\t\t\trows?: number,\n\t\t\tshowBorders?: boolean,\n\t\t\tshowCounter?: boolean,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowDateRangePickerAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tend?: string,\n\t\t\tformat?: string,\n\t\t\tlabelEnd?: string,\n\t\t\tlabelStart?: string,\n\t\t\tlanguage?: string,\n\t\t\tname?: string,\n\t\t\tpreset?: string,\n\t\t\tpresets?: any,\n\t\t\tstart?: string\n\t\t}\n\t\tinterface NowRecordFormSectionConnectedAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tquery?: string,\n\t\t\treadOnlyForm?: boolean,\n\t\t\tsysId?: string,\n\t\t\ttable?: string,\n\t\t\tview?: string\n\t\t}\n\t\tinterface NowRadioGroupAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tdescription?: string,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tlanguage?: string,\n\t\t\tname?: string,\n\t\t\toptions?: Array<{ value?: string, displayValue?: string }>,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tvalue?: any\n\t\t}\n\t\tinterface NowRecordCheckBoxAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tautofocus?: string | boolean,\n\t\t\tconfigAria?: Record<string, string>,\n\t\t\tdescription?: string,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tmessages?: Array<{ type?: string, liveUpdate?: string }>,\n\t\t\tname?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface SecondaryItem {\n\t\t\tfieldLabel?: string,\n\t\t\tdisplayValue?: string,\n\t\t\ttable?: string,\n\t\t\tsysId?: string,\n\t\t\ttype: 'simple' | 'reference' | 'highlighted'\n\t\t}\n\t\tinterface PreviewRecordPayload {\n\t\t\ttable?: string,\n\t\t\tsysId?: string\n\t\t}\n\t\tinterface NowRecordCommonHeaderAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tclassicForm?: boolean,\n\t\t\tprimaryValue?: string,\n\t\t\trecordDisplayValue?: string,\n\t\t\trecordTags?: Array<string>,\n\t\t\tsecondaryItems?: Array<SecondaryItem>,\n\t\t\tsysId?: string,\n\t\t\ttable?: string,\n\t\t\twidth?: string,\n\t\t\tworkspaceConfigId?: string\n\t\t}\n\t\tinterface SidebarModelConditions {\n\t\t\tfield?: string,\n\t\t\toperator?: string,\n\t\t\tvalue?: string,\n\t\t\tnewQuery?: string,\n\t\t\tor?: string,\n\n\t\t}\n\t\tinterface SidbarFormAction {\n\t\t\tactionAttributes?: string,\n\t\t\tactionComponent?: string,\n\t\t\taddignmentId?: string,\n\t\t\ticon?: string,\n\t\t\tlabel?: string,\n\t\t\tmodelConditions?: Array<SidebarModelConditions>,\n\t\t\tname?: string,\n\t\t\torder?: number,\n\t\t\ttooltip?: string\n\t\t}\n\t\tinterface NowRecordCommonSidebarAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tactions?: Array<SidbarFormAction>,\n\t\t\tclassicForm?: boolean,\n\t\t\tformModel?: Record<string, any>,\n\t\t\tmanageOpened?: boolean,\n\t\t\topened?: boolean,\n\t\t\tsidebarPanelExtras?: Record<string, any>\n\t\t}\n\t\tinterface UIAction {\n\t\t\tclientScript?: string,\n\t\t\thasClientScript?: boolean,\n\t\t\thint?: string,\n\t\t\tlabel?: string,\n\t\t\tname?: string,\n\t\t\tsysId?: string,\n\t\t\ttype?: string,\n\t\t}\n\t\tinterface UIActionNode {\n\t\t\tlabel?: string,\n\t\t\toverflow?: boolean,\n\t\t\ttype?: string,\n\t\t\tcolor?: string,\n\t\t\torder?: number,\n\t\t\t'null-null'?: Array<UIAction>\n\t\t}\n\t\tinterface NowRecordCommonUIActionBarAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tclassicForm?: boolean,\n\t\t\thandleClick?: (a: UIAction) => void,\n\t\t\tuiActionNodes?: Array<UIActionNode>,\n\t\t\twidth?: string\n\t\t}\n\t\tinterface NowRecordDatePickerAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tautofocus?: string | boolean,\n\t\t\tconfiAria?: Record<string, string>,\n\t\t\tdescription?: string,\n\t\t\tfirstDayOfWeek?: number,\n\t\t\tformData?: Record<string, any>,\n\t\t\tformat?: string,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tlanguage?: string,\n\t\t\tmessages?: Array<any>,\n\t\t\tname?: string,\n\t\t\tplaceholder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trecordSysId?: string,\n\t\t\trequired?: boolean | string,\n\t\t\ttableName?: string,\n\t\t\ttimePicker?: boolean,\n\t\t\tutcOffset?: number,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowRecordFieldLookupConnectedAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tariDescribedBy?: string,\n\t\t\tariaLabel?: string,\n\t\t\tariaLabelledBy?: string,\n\t\t\tautofocus?: boolean,\n\t\t\tdependentField?: string,\n\t\t\tdependentFieldValue?: string,\n\t\t\tdescription?: string,\n\t\t\tdisableDisplayValueWarning?: boolean,\n\t\t\tdisableEmailFreeFormEntry?: boolean,\n\t\t\tdisableReferenceQualifier?: boolean,\n\t\t\tdisplayValue?: Array<any> | string | number,\n\t\t\tfieldName?: string,\n\t\t\thideReferenceIcon?: boolean,\n\t\t\tinvalid?: boolean,\n\t\t\tisSearching?: boolean,\n\t\t\tlabel?: string,\n\t\t\tmessages?: Array<any>,\n\t\t\tmultiSelection?: boolean,\n\t\t\tname?: string,\n\t\t\tplaceholder?: string,\n\t\t\treadonly?: boolean,\n\t\t\trecordSysId?: string,\n\t\t\treferenceAddonReadonly?: boolean,\n\t\t\treferenceTable?: string,\n\t\t\trequired?: boolean | string,\n\t\t\tresultLimit?: number,\n\t\t\tresults?: Array<any>,\n\t\t\tsearchDebounce?: number,\n\t\t\tserilizedChanges?: string,\n\t\t\ttableName?: string,\n\t\t\tvalue?: any\n\t\t}\n\t\tinterface NowRecordFileAttachmentAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tcomponentType?: string,\n\t\t\tdescription?: string,\n\t\t\tdisplayValue?: string,\n\t\t\terror?: string | boolean,\n\t\t\textensions?: string,\n\t\t\tfileContent?: Object,\n\t\t\tlabel?: string,\n\t\t\tlanguage?: string,\n\t\t\tmaxAttachmentSize?: string,\n\t\t\tmessages?: Array<any>,\n\t\t\tname?: string,\n\t\t\treadonly?: boolean,\n\t\t\trequired?: boolean,\n\t\t\ttableName?: string,\n\t\t\ttableSysId?: string,\n\t\t\tvalue?: string,\n\t\t\tvirusState?: string\n\t\t}\n\t\tinterface HTMLEditorMentionConfig {\n\t\t\tenableMentions?: boolean,\n\t\t\tfetch: Function,\n\t\t\ttable?: string,\n\t\t\tresourceTable?: string,\n\t\t\tresourceSysId?: string,\n\t\t\tmessages?: { loading?: string, noMatches?: string, init?: string }\n\t\t}\n\t\tinterface NowRecordHTMLEditorAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tautofocus?: boolean | string,\n\t\t\tconfigMentions?: HTMLEditorMentionConfig,\n\t\t\tcontentStyle?: string,\n\t\t\tconvertUrls?: boolean,\n\t\t\tdescription?: string,\n\t\t\tenableCodeBlocks?: boolean,\n\t\t\textendedValidElements?: string\n\t\t\tfonts?: string,\n\t\t\theight?: number,\n\t\t\tinvalid?: boolean,\n\t\t\tlabel?: string,\n\t\t\tlanguage?: string,\n\t\t\tmaxHeight?: number,\n\t\t\tmessages?: Array<any>,\n\t\t\tminHeight?: number,\n\t\t\tminLineCount?: number,\n\t\t\tname?: string,\n\t\t\tplaceHolder?: string,\n\t\t\tplugins?: string,\n\t\t\treadonly?: boolean,\n\t\t\treferringRecordSysId?: string,\n\t\t\treferringTable?: string,\n\t\t\trelativeUrls?: boolean,\n\t\t\tremoveHost?: boolean,\n\t\t\trequired?: boolean,\n\t\t\ttoolbar?: Array<string>,\n\t\t\tvalidButtons?: string,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface NowRecordIPAddressAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tdescription?: string,\n\t\t\terror?: string | boolean,\n\t\t\tlabel?: string,\n\t\t\tlanguage?: string,\n\t\t\tmessages?: Array<any>,\n\t\t\tname?: string,\n\t\t\tplaceholder?: string,\n\t\t\trequired?: boolean | string,\n\t\t\tvalue?: string\n\t\t}\n\t\tinterface SnRecordCommonMultiFormAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tsysIds?: Array<string>,\n\t\t\ttable?: string,\n\t\t\ttitle?: string,\n\t\t\tview?: string,\n\t\t\tworkspaceConfigId?: string\n\t\t}\n\t\tinterface NowChartSparkline<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\n\t\t}\n\t\tinterface SnCheckListAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\ttitle?: string,\n\t\t\tchecklistId?: string,\n\t\t\tdocumentId?: string\n\t\t}\n\t\tinterface SnComponentTimelineAttrs<T = HTMLElement> extends React.AriaAttributes, React.DOMAttributes<T> {\n\t\t\tlabel?: string,\n\t\t\tstartDate?: number,\n\t\t\tdisplayStartDate?: number,\n\t\t\tdisplayEndDate?: number,\n\t\t\tendDate?: number,\n\t\t\teventData?: any,\n\t\t\trangeData?: any,\n\t\t\tzoomStepPercent?: number,\n\t\t\tminZoomSpread?: string,\n\t\t\tpanStepPercent?: number,\n\t\t\tlegendEventTitle?: string,\n\t\t\tlegendRangeTitle?: string,\n\t\t\t'hide-pan-zoom'?: boolean,\n\t\t\t'hide-toggle'?: boolean\n\t\t}\n\t\tinterface IntrinsicElements {\n\t\t\t'sn-component-timeline': NowElement<SnComponentTimelineAttrs>,\n\t\t\t'now-alert': NowElement<NowAlertAttrs>,\n\t\t\t'now-alert-list': NowElement<NowAlertListAttrs>,\n\t\t\t'now-avatar': NowElement<NowAvatarAttrs>\n\t\t\t'now-badge': NowElement<NowBadgeAttrs>,\n\t\t\t'now-button': NowElement<NowButtonAttrs>,\n\t\t\t'now-button-bare': NowElement<NowButtonBareAttrs>,\n\t\t\t'now-button-iconic': NowElement<NowButtonIconicAttributes>,\n\t\t\t'now-button-stateful': NowElement<NowButtonStatefulAttributes>,\n\t\t\t'now-calendar': NowElement<NowCalendarAttributes>\n\t\t\t'now-card': NowElement<NowCardAttributes>\n\t\t\t'now-card-divider': NowElement<NowCardDividerAttrs>,\n\t\t\t'now-card-actions': NowElement<NowCardActionsAttributes>,\n\t\t\t'now-card-footer': NowElement<NowCardFooterAttributes>,\n\t\t\t'now-card-header': NowElement<NowCardHeaderAttributes>,\n\t\t\t'now-chart-bar': NowElement<NowChartBarAttrs>\n\t\t\t'now-content-tree': NowElement<NowContentTreeAttributes>,\n\t\t\t'now-dropdown': NowElement<NowDropdownAttributes>,\n\t\t\t'now-heading': NowElement<NowHeadingAttributes>,\n\t\t\t'now-highlighted-value': NowElement<NowHighlightedValueAttributes>\n\t\t\t'now-icon': NowElement<NowIconAttriutes>,\n\t\t\t'now-icon-presence': NowElement<NowIconPresenceAttributes>,\n\t\t\t'now-image': NowElement<NowImageAttributes>,\n\t\t\t'now-label-value-inline': NowElement<NowLabelValueInlineAttributes>,\n\t\t\t'now-label-value-stacked': NowElement<NowLabelValueStackedAttributes>,\n\t\t\t'now-label-value-tabbed': NowElement<NowLabelValueTabbedAttributes>,\n\t\t\t'now-loader': NowElement<NowLoaderAttributes>,\n\t\t\t'now-modal': NowElement<NowModalAttributes>,\n\t\t\t'now-pill': NowElement<NowPillAttributes>,\n\t\t\t'now-progress-bar': NowElement<NowProgressBarAttributes>,\n\t\t\t'now-rich-text': NowElement<NowRichTextAttributes>,\n\t\t\t'now-split-button': NowElement<NowSplitButtonAttributes>\n\t\t\t'now-tabs': NowElement<NowTabsAttributes>,\n\t\t\t'now-template-card-assist': NowElement<NowTemplateCardAssistAttributes>,\n\t\t\t'now-template-card-attachment': NowElement<NowTemplateCardAttachmentAttributes>,\n\t\t\t'now-template-card-omnichannel': NowElement<NowTemplateCardOmniChannelAttributes>,\n\t\t\t'now-text-link': NowElement<NowTextLinkAttributes>,\n\t\t\t'now-toggle': NowElement<NowToggleAttributes>,\n\t\t\t'now-tooltip': NowElement<NowTooltipAttributes>,\n\t\t\t'now-checkbox': NowElement<NowCheckBoxAttrs>,\n\t\t\t'now-collapse': NowElement<NowCollapseAttrs>,\n\t\t\t'now-collapse-trigger': NowElement<NowCollapseTriggerAttrs>,\n\t\t\t'now-dropdown-panel': NowElement<NowDropdownPanelAttrs>,\n\t\t\t'now-input': NowElement<NowInputAtts>,\n\t\t\t'now-input-password': NowElement<NowInputPasswordAttrs>,\n\t\t\t'now-input-phone': NowElement<NowInputPhoneAttrs>,\n\t\t\t'now-input-url': NowElement<NowInputUrlAttrs>,\n\t\t\t'now-legacy-icon': NowElement<NowLegacyIconAttrs>,\n\t\t\t'now-radio-buttons': NowElement<NowRadioButtonsAttr>,\n\t\t\t'now-score-advanced': NowElement<NowScoreAdvancedAttrs>,\n\t\t\t'now-score-basic': NowElement<NowScoreBasicAttrs>,\n\t\t\t'now-stepper': NowElement<NowStepperAttrs>,\n\t\t\t'now-textarea': NowElement<NowTextAreaAttrs>,\n\t\t\t'now-date-range-picker': NowElement<NowDateRangePickerAttrs>,\n\t\t\t'now-record-form-section-connected': NowElement<NowRecordFormSectionConnectedAttrs>,\n\t\t\t'now-radio-group': NowElement<NowRadioGroupAttrs>,\n\t\t\t'now-record-checkbox': NowElement<NowRecordCheckBoxAttrs>,\n\t\t\t'now-record-common-header': NowElement<NowRecordCommonHeaderAttrs>,\n\t\t\t'now-record-common-sidebar': NowElement<NowRecordCommonSidebarAttrs>,\n\t\t\t'now-record-common-uiactionbar': NowElement<NowRecordCommonUIActionBarAttrs>,\n\t\t\t'now-record-date-picker': NowElement<NowRecordDatePickerAttrs>,\n\t\t\t'now-record-field-lookup-connected': NowElement<NowRecordFieldLookupConnectedAttrs>,\n\t\t\t'now-record-file-attachment': NowElement<NowRecordFileAttachmentAttrs>,\n\t\t\t'now-record-html-editor': NowElement<NowRecordHTMLEditorAttrs>,\n\t\t\t'now-record-ip-address': NowElement<NowRecordIPAddressAttrs>,\n\t\t\t'sn-record-common-multi-form': NowElement<SnRecordCommonMultiFormAttrs>,\n\t\t\t'sn-checklist': NowElement<SnCheckListAttrs>\n\t\t}\n\t}\n}", "sample": "\nimport { createCustomElement } from \"@servicenow/ui-core\";\nimport { createElement } from '@servicenow/ui-renderer-snabbdom';\n// import props from './props';\n// import state from './state';\n// import styles from './styles';\n\n// const properties = { ...props };\n// const initialState = { ...state };\ncreateCustomElement('sn-awesome-component', {\n\tstyles: '',\n\tinitialState: {age: 12},\n\tproperties: {\n\t\tname: {default: \"ServiceNow\"}\n\t},\n\tview(state) {\n\t\treturn (<div>\n\t\t\t<button className=\"button\">{state.properties.name}</button>\n\t\t\t<button className=\"button red-btn\">{state.age}</button>\n\t\t</div>);\n\t}\n});" };
});
define("siDeclEmittor", ["require", "exports", "constants", "siParser", "tsCompilerOptions", "recordWatcher", "seismic", "schemaParser", "codenowUtils"], function (require, exports, editorConst, siParser, tsCompilerOptions_1, recordWatcher_2, seismic_1, schemaParser_2, codenowUtils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    editorConst = __importStar(editorConst);
    siParser = __importStar(siParser);
    tsCompilerOptions_1 = __importDefault(tsCompilerOptions_1);
    var TokenType = siParser.TokenType;
    var javaTypeDisposable;
    var tableTypeDisposable;
    var jsTypeDeclarationDisposable;
    var typeDefDeclarationDisposable;
    var prevScope = '';
    var ThreadCmdType;
    (function (ThreadCmdType) {
        ThreadCmdType[ThreadCmdType["THREAD_INITIALIZED"] = 0] = "THREAD_INITIALIZED";
        ThreadCmdType[ThreadCmdType["SCRIPT_INCLUDE_REQUEST"] = 1] = "SCRIPT_INCLUDE_REQUEST";
        ThreadCmdType[ThreadCmdType["SCRIPT_INCLUDE_RESPONSE"] = 2] = "SCRIPT_INCLUDE_RESPONSE";
        ThreadCmdType[ThreadCmdType["SINGLE_SCRIPT_INCLUDE_REQUEST"] = 3] = "SINGLE_SCRIPT_INCLUDE_REQUEST";
        ThreadCmdType[ThreadCmdType["SINGLE_SCRIPT_INCLUDE_RESPONSE"] = 4] = "SINGLE_SCRIPT_INCLUDE_RESPONSE";
        ThreadCmdType[ThreadCmdType["UPDATE_LIBS"] = 5] = "UPDATE_LIBS";
        ThreadCmdType[ThreadCmdType["PROGRESS_MSG"] = 6] = "PROGRESS_MSG";
    })(ThreadCmdType || (ThreadCmdType = {}));
    class SingleSIRequestHandler {
        // private lib: string;
        // private typeDecl: Array<siParser.TSDefinitionRecordData>;
        constructor() {
        }
        static getInstance(lib, typeDecl, siRecord) {
            if (SingleSIRequestHandler.instance == null) {
                SingleSIRequestHandler.instance = new SingleSIRequestHandler();
                SingleSIRequestHandler.instance.typeInfo = siParser.TSChecker.initTypeInfoForSingleSI(lib, typeDecl, siRecord);
                return SingleSIRequestHandler.instance;
            }
            else if (lib && typeDecl) {
                SingleSIRequestHandler.instance.typeInfo.dispose();
                SingleSIRequestHandler.instance.typeInfo = siParser.TSChecker.initTypeInfoForSingleSI(lib, typeDecl, siRecord);
            }
            return SingleSIRequestHandler.instance;
        }
        handleRequest(msg) {
            let siRecord = new siParser.ClientSIRecordData(msg.siRecord);
            currentSI = siRecord;
            console.log('si reqest parser came');
            if (currentSI.isNew()) {
                if (siRecord.api_name.split('.').length < 2)
                    siRecord.api_name = 'global.Point';
            }
            //let scriptAfterDotWalkTransform = currentSI.tsscript;
            //if(currentSI.isJavascript())
            //	scriptAfterDotWalkTransform = TSCompilerHost.getModelValueAfterTransform(currentSI.tsscript);
            // if(currentSI.isTypescript())
            // 	currentSI.tsscript = scriptAfterDotWalkTransform;
            // else
            //currentSI.script = scriptAfterDotWalkTransform;
            //currentSI.tsscript = scriptAfterDotWalkTransform;
            return this.typeInfo.getTypeInfo(currentSI, msg.options);
        }
    }
    exports.SingleSIRequestHandler = SingleSIRequestHandler;
    class MyWorkerDispatcher {
        constructor(sender) {
            this.sender = sender;
            this.pendingReplies = {};
            this.seqNumber = 0;
            sender.onmessage = this.handleMessage.bind(this);
        }
        cancelAllExistingPromises() {
            for (let prop in this.pendingReplies) {
                this.pendingReplies[prop].reject("Parser thread is too busy for this operation. Please try again or contact yln99517@gmail.com with your SI");
                delete this.pendingReplies[prop];
            }
        }
        sendReplyMsg(msg, replyMsgId) {
            /// @ts-ignore
            this.sender.postMessage(Object.assign({ seqNum: replyMsgId }, msg));
        }
        sendMsg(msg) {
            var replyMsgId = String(this.seqNumber++);
            var finalMsg = Object.assign({ seqNum: replyMsgId }, msg);
            var p = new Promise((resolve, reject) => {
                this.pendingReplies[replyMsgId] = {
                    resolve: resolve,
                    reject: reject
                };
                /// @ts-ignore
                this.sender.postMessage(finalMsg);
            });
            return p;
        }
        isSIProgressMsg(msg) {
            return msg.cmd == ThreadCmdType.PROGRESS_MSG;
        }
        isSingleSIRequest(msg) {
            return msg.cmd == ThreadCmdType.SINGLE_SCRIPT_INCLUDE_REQUEST;
        }
        isSIParserRequest(msg) {
            return msg.cmd == ThreadCmdType.SCRIPT_INCLUDE_REQUEST;
        }
        isSIParserResp(msg) {
            return msg.cmd == ThreadCmdType.SCRIPT_INCLUDE_RESPONSE;
        }
        isLibUpdateMsg(msg) {
            return msg.cmd == ThreadCmdType.UPDATE_LIBS;
        }
        handleMessage(e) {
            var msg = e.data;
            var reply = this.pendingReplies[msg.seqNum];
            if (reply) {
                delete this.pendingReplies[msg.seqNum];
                try {
                    msg.errorMsg ? reply.reject(msg.errorMsg) : reply.resolve(msg);
                }
                catch (e) {
                    console.log('error on resolving thread message ' + e);
                }
                return;
            }
            if (this.isSIParserRequest(msg)) {
                var result = siParser.TSChecker.generateTypeInfo(msg.siRecords, msg.lib, msg.typeDecl, (data) => {
                    var msg = {
                        seqNum: "-1",
                        cmd: ThreadCmdType.PROGRESS_MSG,
                        name: data.name,
                        sysId: data.sysId,
                        percentage: data.percentage,
                        decl: data.decl
                    };
                    //self.postMessage(msg, '*');
                    this.sendReplyMsg(msg, "-1");
                });
                var replyObj = {
                    seqNum: msg.seqNum,
                    cmd: ThreadCmdType.SCRIPT_INCLUDE_RESPONSE,
                    formatterResult: result.formatterResult,
                    types: result.types,
                    errors: result.errors
                };
                this.sendReplyMsg(replyObj, msg.seqNum);
            }
            else if (this.isSingleSIRequest(msg)) {
                let sr1 = SingleSIRequestHandler.getInstance().handleRequest(msg);
                this.sendReplyMsg(sr1, msg.seqNum);
            }
            else if (this.isLibUpdateMsg(msg)) {
                SingleSIRequestHandler.getInstance(msg.lib, msg.typeDecl, msg.siRecord);
                self.recordConfig.isFromScriptRunner = msg.isScriptRunner;
                this.sendReplyMsg({ replayMsg: 'thank you', cmd: ThreadCmdType.SINGLE_SCRIPT_INCLUDE_RESPONSE }, msg.seqNum);
            }
            else if (msg.cmd == ThreadCmdType.THREAD_INITIALIZED) {
                isWorkerThreadInitialized = true;
            }
            else if (this.isSIProgressMsg(msg)) {
                if (isMainThread()) {
                    observeParserThread(true);
                    siReturnType[msg.sysId] = !!msg.decl;
                    if (!msg.decl)
                        console.log('Parser started for => ' + msg.name);
                    if (typeof window.onSIParserProgressEvent == 'function')
                        window.onSIParserProgressEvent(msg);
                }
                //console.log(msg.name + ' - ' + msg.percentage);
            }
        }
    }
    function isMainThread() {
        return typeof window != 'undefined';
    }
    exports.isMainThread = isMainThread;
    function isWorkerThread() {
        return !isMainThread();
    }
    exports.isWorkerThread = isWorkerThread;
    function canWriteSI() {
        if (isWorkerThread())
            return true;
        return canReadSI() && window.recordConfig.canWrite;
    }
    exports.canWriteSI = canWriteSI;
    function canReadSI() {
        if (isWorkerThread())
            return true;
        return window.recordConfig.canRead;
    }
    exports.canReadSI = canReadSI;
    var isWorkerThreadInitialized = false;
    var workerDispatcher;
    function onThreadInitialized(msgSender) {
        if (!canWriteSI())
            return;
        if (!msgSender)
            return;
        workerDispatcher = new MyWorkerDispatcher(msgSender);
        self["yln"] = {
            dispatcher: workerDispatcher
        };
        workerDispatcher.sendMsg({ cmd: ThreadCmdType.THREAD_INITIALIZED });
    }
    exports.onThreadInitialized = onThreadInitialized;
    var isLibUpdated;
    let pendingRequests = 0;
    let parserTimerId = -1;
    function observeParserThread(clearExisting = false) {
        if (window.recordConfig.isYLNSource)
            return;
        var previousWorker = window.ylnWorker;
        if (clearExisting) {
            clearTimeout(parserTimerId);
            parserTimerId = -1;
        }
        if (parserTimerId != -1)
            return;
        const threadWaitTime = Math.max(60, parseInt(localStorage.getItem('codenow.threadWaitTime') || '15'));
        parserTimerId = window.setTimeout(() => {
            if (previousWorker != window.ylnWorker)
                return;
            console.error('unresponsive parser thread. killing it');
            window.ylnWorker.terminate();
            isLibUpdated = false;
            pendingRequests = 0;
            currentSI.parseReturnType = false;
            workerDispatcher.cancelAllExistingPromises();
            createParserThread(require('./SIDeclEmittor'));
        }, threadWaitTime * 1000);
    }
    function generateTypeDeclForSingleRecord(options = Object.assign({}, getCompilerOptions(getCurrentSI().isJavascript())), previousPromise) {
        if (!canWriteSI())
            return Promise.reject("Unable to write Script Include");
        //FIXME: need more robust solution to handle multiple requests.
        //if(pendingRequests != 0)
        //	return Promise.reject(JSON.stringify({ error: 'already serving on pending request', id: 2}));
        let localSI = Object.assign({}, currentSI);
        localSI.script = '';
        localSI.typedeclaration = '';
        localSI.typesourcemap = '';
        if (!isLibUpdated) {
            let msg = {
                cmd: ThreadCmdType.UPDATE_LIBS,
                lib: require('vs/language/typescript/lib/lib').lib_es5_dts,
                typeDecl: typeDecl,
                siRecord: localSI,
                isScriptRunner: isScriptRunner()
            };
            workerDispatcher.sendMsg(msg).then(function () {
                isLibUpdated = true;
            });
        }
        let msg = {
            cmd: ThreadCmdType.SINGLE_SCRIPT_INCLUDE_REQUEST,
            siRecord: localSI,
            options: options
        };
        let p = workerDispatcher.sendMsg(msg);
        observeParserThread();
        p.then(() => {
            clearTimeout(parserTimerId);
            parserTimerId = -1;
            pendingRequests--;
        }, () => {
            clearTimeout(parserTimerId);
            parserTimerId = -1;
            pendingRequests--;
        });
        pendingRequests++;
        return p;
    }
    exports.generateTypeDeclForSingleRecord = generateTypeDeclForSingleRecord;
    const apiMap = {};
    exports.gotoDefintionService = {
        open: function () {
            //{"0":{"$mid":1,"path":"/85","scheme":"http","authority":"global.NotifyOnTaskAjaxProcessorSNC_V2"}}
            var data = arguments[0];
            if (typeof arguments[0] === 'string')
                data = monaco.Uri.parse(arguments[0]);
            if (data.authority === 'code.devsnc.com') {
                window.open(arguments[0]);
                return;
            }
            let tokens = data.authority.split('.');
            const siMap = getSIMap();
            if (!siMap || !siMap[tokens[0]]) {
                window.open(data.toString(), null);
                console.log('invalid scope name when opening file ' + data.authority);
                return;
            }
            const siDecl = siMap[tokens[0]].find((item) => {
                return item.api == tokens[1];
            });
            if (!siDecl) {
                console.log('invalid scope name when opening file ' + data.authority);
                return;
            }
            var line = data.path.substr(1);
            var urlPath = `./sys_script_include.do?sys_id=${siDecl.id}&gotoLine=${line}`;
            window.open(urlPath);
            console.log(JSON.stringify(arguments));
            return {
                catch: function (errorCallback) {
                    console.log('eror callback');
                }
            };
        }
    };
    var allSI = {};
    var siReturnType = {};
    function generateTypeDeclarations(siRecords) {
        if (!canWriteSI())
            return Promise.reject("Unable to write Script Include");
        var libSrc = require('vs/language/typescript/lib/lib').lib_es5_dts;
        siRecords.forEach(item => {
            allSI[item.sys_id] = {
                record: item,
            };
            item.parseReturnType = true;
            if (typeof siReturnType[item.sys_id] != 'undefined') {
                if (!siReturnType[item.sys_id])
                    console.log('skipping return type for ' + item.api_name);
                item.parseReturnType = siReturnType[item.sys_id];
            }
        });
        observeParserThread();
        //window.ylnWorker.postMessage({ cmd: 1, types: typeDecl, siData: siData, libs: libSrc });
        var promise = workerDispatcher.sendMsg({ cmd: ThreadCmdType.SCRIPT_INCLUDE_REQUEST, typeDecl: typeDecl, lib: libSrc, siRecords: siRecords });
        return promise;
    }
    exports.generateTypeDeclarations = generateTypeDeclarations;
    function scopeUpdated() {
        let currentScope = currentSI.getScopeAndAPIMap().scope;
        var tsDefaults = monaco.languages.typescript.typescriptDefaults;
        //if (currentSI.isJavascript())
        //	tsDefaults = monaco.languages.typescript.javascriptDefaults;
        if (prevScope.length == 0 || prevScope != currentScope) {
            if (prevScope.length != 0)
                javaTypeDisposable.dispose();
            if (currentScope == editorConst.GLOBAL_SOCPE)
                javaTypeDisposable = tsDefaults.addExtraLib(javaAPI, 'yln_' + monacoCacheCounter + editorConst.JAVA_GLOBAL_API);
            else
                javaTypeDisposable = tsDefaults.addExtraLib(javaScopedAPI, 'yln_' + monacoCacheCounter + editorConst.JAVA_SCOPE_API);
            if (!(prevScope !== editorConst.GLOBAL_SOCPE && currentScope !== editorConst.GLOBAL_SOCPE)) {
                if (tableTypeDisposable)
                    tableTypeDisposable.dispose();
                let dts = schemaParser_2.SchemaDTSGenerator.generate(tableJSONPayload.tableMap, tableJSONPayload.choiceMap, currentScope !== editorConst.GLOBAL_SOCPE);
                dts += `\n\n ${tableCustomization}`;
                tableTypeDisposable = tsDefaults.addExtraLib(dts, `yln_${monacoCacheCounter}_${editorConst.TABLE_API}`);
            }
        }
        prevScope = currentScope;
    }
    exports.scopeUpdated = scopeUpdated;
    var monacoCacheCounter = 0;
    function apiDeclarationUpdated() {
        monacoCacheCounter++;
        scopeUpdated();
        let defEmittor = new siParser.DefinitionEmittor(siJSData);
        var excludedTypes = {};
        if (!currentSI.isNew())
            excludedTypes[currentSI.sys_id] = true;
        jsAPI = defEmittor.emit(currentSI.getScopeAndAPIMap().scope, excludedTypes) + TokenType.newline + jsCustomization;
        if (jsTypeDeclarationDisposable) {
            jsTypeDeclarationDisposable.dispose();
            jsTypeDeclarationDisposable = null;
        }
        var jsAPIName = 'yln_' + monacoCacheCounter + editorConst.JS_API;
        jsTypeDeclarationDisposable = monaco.languages.typescript.typescriptDefaults.addExtraLib(jsAPI, jsAPIName);
        if (typeDefDeclarationDisposable)
            typeDefDeclarationDisposable.dispose();
        typeDefDeclarationDisposable = null;
        let typeDefMap = siParser.TSChecker.getTypeDefsAsScopeMap(siJSData, currentSI.sys_id);
        let typeDefLibs = siParser.TSChecker.generateTypedefDeclFromScopemap(typeDefMap);
        var typeDeclAPI = 'yln_' + monacoCacheCounter + editorConst.TYPE_DEFS;
        typeDefDeclarationDisposable = monaco.languages.typescript.typescriptDefaults.addExtraLib(typeDefLibs, typeDeclAPI);
        isLibUpdated = false;
    }
    exports.apiDeclarationUpdated = apiDeclarationUpdated;
    function siUpdated(siFormat) {
        if (!siFormat) {
            apiDeclarationUpdated();
            return;
        }
        if (siFormat.id == currentSI.sys_id)
            return;
        //var scopeName = siFormat.sc;
        if (!siFormat.sc) {
            console.warn('scope name not found in record watcher ' + JSON.stringify(siFormat));
            return;
        }
        if (!siJSData[siFormat.sc])
            siJSData[siFormat.sc] = [];
        let index = -1;
        let items = siJSData[siFormat.sc];
        //items.find( item => item.id == siFormat.id);
        for (let i = 0; i < items.length; i++) {
            if (items[i].id == siFormat.id) {
                index = i;
                break;
            }
        }
        let siDeclFormat = siParser.SITSFormat.expandMinifiedFormat(siFormat, siFormat.sc, siParser.SITSFormat.isTypescript(siFormat.f));
        if (index == -1)
            siJSData[siFormat.sc].push(siDeclFormat);
        else {
            if (siFormat.op != 'delete')
                siJSData[siFormat.sc][index] = siDeclFormat;
            else {
                siJSData[siFormat.sc].splice(index, 1);
            }
        }
        apiDeclarationUpdated();
    }
    exports.siUpdated = siUpdated;
    var channel;
    if (isMainThread() && isServiceNow() && !isSeismicComponent()) {
        const watcher = recordWatcher_2.RecordWatcher();
        if (watcher) {
            const socketChannel = watcher.getChannel("/yln/typedef");
            socketChannel.subscribe((msg) => {
                siUpdated(msg.data);
            });
        }
        // channel = new BroadcastChannel("yln_sys_script_include");
        // channel.onmessage = function (ev) {
        // 	let siFormat = JSON.parse(ev.data as string) as siParser.SITSFormat;
        // 	siUpdated(siFormat);
        // 	console.log(ev.data);
        // }
    }
    function updateSIDeclListeners(newSIDecl) {
        if (!!channel)
            channel.postMessage(JSON.stringify(newSIDecl));
    }
    exports.updateSIDeclListeners = updateSIDeclListeners;
    function isServiceNow() {
        return !!window.g_ck;
    }
    exports.isServiceNow = isServiceNow;
    class TranspilerOutput {
        constructor(js = '', declaration = '', sourceMap = '', tsScript = '', backEndDecl, linterErrors) {
            this.js = js;
            this.declaration = declaration;
            this.sourceMap = sourceMap;
            this.tsScript = tsScript;
            this.backEndDecl = backEndDecl;
            this.linterErrors = linterErrors;
        }
    }
    exports.TranspilerOutput = TranspilerOutput;
    // const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
    // 	function visit(node: ts.Node): ts.Node {
    // 		node = ts.visitEachChild(node, visit, context);
    // 		//if (node.kind != ts.SyntaxKind.TemplateExpression)
    // 		if (!ts.isTemplateExpression(node))
    // 			return node;
    // 		let text = node.getFullText();
    // 		let regExp = siParser.getDotWalkingRegExp();
    // 		let regArray = text.match(regExp);
    // 		if (!regArray)
    // 			return node;
    // 		if (regArray.length == 0)
    // 			return node;
    // 		var tokens = regArray[0].split('.');
    // 		if (tokens.length <= 1)
    // 			return node;
    // 		function replace(str: string) {
    // 			let copyStr = str.replace(regExp, ($0: string, $1: string, $2: string, $3: string, $4: string, $5: string) => {
    // 				var copy$2 = $2;
    // 				$2 = $2.replace(/^\$\${/, '');
    // 				$2 = $2.replace(/\}$/, '');
    // 				let tokens = $2.split('.');
    // 				if (tokens.length == 1)
    // 					return copy$2;
    // 				tokens.splice(0, 1);
    // 				return $1 + tokens.join('.') + $3;
    // 			});
    // 			//FIXME: why extra space is appearing at first position
    // 			return copyStr.trim();
    // 		}
    // 		let strLiteral = replace(text);
    // 		return ts.createStringLiteral(strLiteral);
    // 	}
    // 	return ts.visitNode(rootNode, visit);
    // };
    function isScriptRunner() {
        if (!window.recordConfig)
            return false;
        return window.recordConfig.isFromScriptRunner && typeof (g_form) == 'undefined';
    }
    exports.isScriptRunner = isScriptRunner;
    var ScriptTarget;
    (function (ScriptTarget) {
        ScriptTarget[ScriptTarget["ES3"] = 0] = "ES3";
        ScriptTarget[ScriptTarget["ES5"] = 1] = "ES5";
        ScriptTarget[ScriptTarget["ES2015"] = 2] = "ES2015";
        ScriptTarget[ScriptTarget["ES2016"] = 3] = "ES2016";
        ScriptTarget[ScriptTarget["ES2017"] = 4] = "ES2017";
        ScriptTarget[ScriptTarget["ES2018"] = 5] = "ES2018";
        ScriptTarget[ScriptTarget["ESNext"] = 6] = "ESNext";
        ScriptTarget[ScriptTarget["JSON"] = 100] = "JSON";
        ScriptTarget[ScriptTarget["Latest"] = 6] = "Latest";
    })(ScriptTarget || (ScriptTarget = {}));
    function getCompilerOptions(isJS, isES6 = false) {
        let editorCompilerOptions = {};
        if (isJS) {
            var jsOptions = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
            jsOptions.target = tsCompilerOptions_1.default.target;
            jsOptions.allowJs = tsCompilerOptions_1.default.allowJs;
            jsOptions.checkJs = tsCompilerOptions_1.default.checkJs;
            jsOptions.strict = tsCompilerOptions_1.default.strict;
            jsOptions.jsx = tsCompilerOptions_1.default.jsx;
            jsOptions.jsxFactory = tsCompilerOptions_1.default.jsxFactory;
            jsOptions.noImplicitAny = tsCompilerOptions_1.default.noImplicitAny;
            jsOptions.strictNullChecks = tsCompilerOptions_1.default.strictNullChecks;
            if (tsCompilerOptions_1.default.target > ScriptTarget.ES2015 || isScriptRunner())
                jsOptions.sourceMap = tsCompilerOptions_1.default.sourceMap;
            jsOptions.noImplicitThis = tsCompilerOptions_1.default.noImplicitThis;
            jsOptions.noImplicitReturns = tsCompilerOptions_1.default.noImplicitReturns;
            jsOptions.noUnusedParameters = tsCompilerOptions_1.default.noUnusedParameters;
            jsOptions.noUnusedLocals = tsCompilerOptions_1.default.noUnusedLocals;
            jsOptions.noFallthroughCasesInSwitch = tsCompilerOptions_1.default.noFallthroughCasesInSwitch;
            jsOptions.linter = tsCompilerOptions_1.default.linter;
            if (!isES6)
                jsOptions.declaration = false;
            return jsOptions;
        }
        editorCompilerOptions.jsx = tsCompilerOptions_1.default.jsx;
        editorCompilerOptions.jsxFactory = tsCompilerOptions_1.default.jsxFactory;
        editorCompilerOptions.noFallthroughCasesInSwitch = tsCompilerOptions_1.default.noFallthroughCasesInSwitch;
        editorCompilerOptions.allowUnreachableCode = tsCompilerOptions_1.default.allowUnreachableCode;
        editorCompilerOptions.module = monaco.languages.typescript.ModuleKind.None;
        editorCompilerOptions.noResolve = tsCompilerOptions_1.default.noResolve;
        editorCompilerOptions.skipLibCheck = tsCompilerOptions_1.default.skipLibCheck;
        editorCompilerOptions.skipDefaultLibCheck = tsCompilerOptions_1.default.skipDefaultLibCheck;
        editorCompilerOptions.target = tsCompilerOptions_1.default.target;
        editorCompilerOptions.noImplicitAny = tsCompilerOptions_1.default.noImplicitAny;
        editorCompilerOptions.strictNullChecks = tsCompilerOptions_1.default.strictNullChecks;
        editorCompilerOptions.noImplicitThis = tsCompilerOptions_1.default.noImplicitThis;
        editorCompilerOptions.noImplicitReturns = tsCompilerOptions_1.default.noImplicitReturns;
        editorCompilerOptions.experimentalDecorators = tsCompilerOptions_1.default.experimentalDecorators;
        editorCompilerOptions.noUnusedLocals = tsCompilerOptions_1.default.noUnusedLocals;
        editorCompilerOptions.noUnusedParameters = tsCompilerOptions_1.default.noUnusedParameters;
        editorCompilerOptions.declaration = tsCompilerOptions_1.default.declaration;
        editorCompilerOptions.sourceMap = tsCompilerOptions_1.default.sourceMap;
        editorCompilerOptions.noEmitHelpers = tsCompilerOptions_1.default.noEmitHelpers;
        editorCompilerOptions.isolatedModules = tsCompilerOptions_1.default.isolatedModules;
        editorCompilerOptions.noEmitOnError = tsCompilerOptions_1.default.noEmitOnError;
        editorCompilerOptions.allowJs = true;
        editorCompilerOptions['strict'] = tsCompilerOptions_1.default.strict;
        editorCompilerOptions["stripInternal"] = tsCompilerOptions_1.default.stripInternal;
        editorCompilerOptions['linter'] = tsCompilerOptions_1.default.linter;
        return editorCompilerOptions;
    }
    exports.getCompilerOptions = getCompilerOptions;
    // export class TSCompilerHost implements ts.CompilerHost {
    // 	SOURCE_PATH = "module.ts";
    // 	readonly LIB_PATH = "lib.d.ts";
    // 	readonly SN_LIB_PATH = "node_modules/@types/snlib/index.d.ts";
    // 	private sourceFileMap: { [fileName: string]: ts.SourceFile; } = {};
    // 	private fileMap: { [fileName: string]: string; } = {};
    // 	constructor(public sourceContent: string, public readonly libContent: string,
    // 		public readonly snLibContent: string, scriptKind = ts.ScriptTarget.ES5) {
    // 		libContent += '\n\n\n' + getAllDeclAPI();
    // 		this.sourceFileMap[this.LIB_PATH] = ts.createSourceFile(this.LIB_PATH, libContent, scriptKind);
    // 		// let fileName = currentSI.isJavascript() ? 'proxyModel.js' : 'proxyModel.ts';
    // 		let kind = currentSI.isJavascript() ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    // 		if (currentSI.isJavascript())
    // 			this.SOURCE_PATH = 'module.js';
    // 		const sourceFile: ts.SourceFile = ts.createSourceFile(this.SOURCE_PATH, currentSI.tsscript, ts.ScriptTarget.ES5, true, kind);
    // 		this.sourceFileMap[this.SOURCE_PATH] = sourceFile;
    // 		const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(sourceFile, [transformer]);
    // 		const transformedSourceFile: ts.SourceFile = result.transformed[0];
    // 		const printer: ts.Printer = ts.createPrinter();
    // 		let transformedModel = printer.printFile(transformedSourceFile)
    // 		//this.sourceFileMap[this.SOURCE_PATH] = ts.createSourceFile(this.SOURCE_PATH, sourceContent, scriptKind)
    // 		ts.disposeEmitNodes(sourceFile);
    // 		//this.sourceFileMap[this.SOURCE_PATH] = transformedSourceFile;
    // 		result.dispose();
    // 		//if(!currentSI.isJavascript())
    // 		this.sourceFileMap[this.SOURCE_PATH] = sourceFile.update(transformedModel, {
    // 			span: {
    // 				start: 0,
    // 				length: sourceContent.length
    // 			}, newLength: transformedModel.length
    // 		});
    // 		//this.sourceFileMap[this.SOURCE_PATH] = TSCompilerHost.getSourceAfterTransform();
    // 	}
    // 	getFileMap(): Readonly<{ [fileName: string]: string; }> {
    // 		return this.fileMap;
    // 	}
    // 	getSourceFile(fileName: string) {
    // 		return this.sourceFileMap[fileName];
    // 	}
    // 	writeFile(_name: string, text: string) {
    // 		if (_name == "module.js")
    // 			this.fileMap.js = text;
    // 		else if (_name == "module.d.ts")
    // 			this.fileMap.declaration = text;
    // 		else
    // 			this.fileMap.sourceMap = text;
    // 	}
    // 	getDefaultLibFileName() {
    // 		return "lib.d.ts";
    // 	}
    // 	useCaseSensitiveFileNames() {
    // 		return false;
    // 	}
    // 	getCanonicalFileName(fileName: string) {
    // 		return fileName;
    // 	}
    // 	getCurrentDirectory() {
    // 		return "";
    // 	}
    // 	getNewLine() {
    // 		return "\r\n";
    // 	}
    // 	fileExists(fileName: string) {
    // 		return true;
    // 	}
    // 	readFile(fileName: string): string {
    // 		return "";
    // 	}
    // 	directoryExists() {
    // 		return true;
    // 	}
    // 	getDirectories() {
    // 		return [];
    // 	}
    // 	static compile(options: ts.CompilerOptions = { ...getCompilerOptions(false) }, isJS = false) {
    // 		let output = new TranspilerOutput();
    // 		//let libContent = libs.getLibContent() + '\n\n\n' + getAllDeclAPI();
    // 		let libContent = require('vs/language/typescript/lib/lib').lib_es5_dts + '\n\n\n' + getAllDeclAPI();
    // 		var compilerHost = new TSCompilerHost(getCurrentSI().tsscript, libContent, getAllDeclAPI());
    // 		let program = ts.createProgram([isJS ? "module.js" : "module.ts"], options, compilerHost);
    // 		let emitResult = program.emit();
    // 		let fileMap = compilerHost.getFileMap();
    // 		for (var p in fileMap) {
    // 			console.log(fileMap[p]);
    // 		}
    // 		let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    // 		allDiagnostics.forEach(diagnostic => {
    // 			if (diagnostic.file) {
    // 				let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    // 				let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    // 				console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    // 			}
    // 			else {
    // 				console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    // 			}
    // 		});
    // 		let exitCode = emitResult.emitSkipped ? 1 : 0;
    // 		console.log(`Process exiting with code '${exitCode}'.`);
    // 		//return compilerHost.getFileMap();
    // 		//output.declaration = fileMap.declaration;
    // 		program.getSourceFiles().forEach(source => ts.disposeEmitNodes(source));
    // 		if (exitCode != 0) {
    // 			return Promise.reject("Compilation Errros");
    // 			//return new Error("Erroros");
    // 		}
    // 		output.js = fileMap.js;
    // 		output.tsScript = currentSI.tsscript;
    // 		output.sourceMap = fileMap.sourceMap;
    // 		var siFormat = currentSI.emitTSDeclaration(fileMap.declaration);
    // 		output.declaration = currentSI.typedeclaration = JSON.stringify(siFormat);
    // 		currentSI.script = output.js;
    // 		currentSI.typesourcemap = output.sourceMap;
    // 		return Promise.resolve(output);
    // 		//return output;
    // 	}
    // 	static getModelValueAfterTransform(scriptValue: string) {
    // 		let result = TSCompilerHost.applyTemplateTransformation(scriptValue);
    // 		const transformedSourceFile: ts.SourceFile = result.transformed[0];
    // 		const printer: ts.Printer = ts.createPrinter();
    // 		let transformedModel = printer.printFile(transformedSourceFile);
    // 		result.dispose();
    // 		return transformedModel;
    // 	}
    // 	static getSourceAfterTransform(scriptValue: string) {
    // 		let r = TSCompilerHost.applyTemplateTransformation(scriptValue);
    // 		return r.transformed[0];
    // 	}
    // 	static applyTemplateTransformation(scriptValue: string) {
    // 		let fileName = 'proxyModel.js';
    // 		let kind = ts.ScriptKind.JS;
    // 		if (currentSI.isTypescript()) {
    // 			fileName = 'proxyModel.ts';
    // 			kind = ts.ScriptKind.TS;
    // 		}
    // 		const sourceFile: ts.SourceFile = ts.createSourceFile(fileName, scriptValue, ts.ScriptTarget.ES5, true, kind);
    // 		const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(
    // 			sourceFile, [siParser.TSChecker.dotWalkingTransformer]
    // 		);
    // 		return result;
    // 	}
    // }
    // if (isMainThread())
    // 	window["transform"] = TSCompilerHost.getModelValueAfterTransform;
    class RecordFetcher {
        constructor(pathName, filter = '') {
            this.pathName = pathName;
            this.filter = filter;
        }
        fetch() {
            if (this.fetchPromise)
                return this.fetchPromise;
            var self = this;
            this.fetchPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let result = yield codenowUtils_2.CodeNowUtils.doAction({ cmd: 'get_type_definitions' }, true);
                resolve(result.types);
            }));
            return this.fetchPromise;
        }
        onFetch(result) {
        }
    }
    exports.RecordFetcher = RecordFetcher;
    class CachedRecordData extends RecordFetcher {
        constructor(pathName, filter = '') {
            super(pathName, filter);
            this.pathName = pathName;
            this.isDataAvailable = false;
            if (!isServiceNow() || isJSCacheReady()) {
                this.isDataAvailable = true;
                this.cachedData = codeNowTypeDefinitions.result;
            }
        }
        fetch() {
            if (this.isDataAvailable) {
                return new Promise((resolve, reject) => {
                    resolve(this.cachedData);
                });
            }
            return super.fetch();
        }
        onFetch(response) {
            this.isDataAvailable = true;
            this.cachedData = response.result;
        }
    }
    exports.CachedRecordData = CachedRecordData;
    var tsPath = editorConst.DECLARATION_TABLE_PATH;
    if (isMainThread() && !isServiceNow())
        tsPath = editorConst.DECLARATION_DATA_PATH;
    var tsDeclarations = null;
    if (isMainThread()) {
        tsDeclarations = new CachedRecordData(tsPath, "");
        tsDeclarations.fetch();
    }
    let siJSData;
    let javaAPI = '';
    let javaScopedAPI = '';
    let tableAPI = '';
    let jsAPI = '';
    let jsCustomization = '';
    let typedefAPI = '';
    let tableJSONPayload = {};
    let tableCustomization = ``;
    function getSIMap() {
        return siJSData;
    }
    exports.getSIMap = getSIMap;
    function getJavaAPI() {
        if (getCurrentSI().isGlobalScope())
            return javaAPI;
        return javaScopedAPI;
    }
    exports.getJavaAPI = getJavaAPI;
    function setJavaAPI(newValue) {
        javaAPI = newValue;
    }
    exports.setJavaAPI = setJavaAPI;
    function getTableAPI() {
        return tableAPI;
    }
    exports.getTableAPI = getTableAPI;
    function getJSAPI() {
        return jsAPI;
    }
    exports.getJSAPI = getJSAPI;
    function getTypedefAPI() {
        return typedefAPI;
    }
    exports.getTypedefAPI = getTypedefAPI;
    function getAllDeclAPI() {
        return getJavaAPI() + TokenType.newline + getTableAPI() + TokenType.newline + getJSAPI() + TokenType.newline + getTypedefAPI();
    }
    exports.getAllDeclAPI = getAllDeclAPI;
    var typeDecl;
    function getTypeDeclarations() {
        return typeDecl;
    }
    exports.getTypeDeclarations = getTypeDeclarations;
    function internalInitializeEx(tsDef, apiName, sysId, excludedTypes) {
        typeDecl = tsDef;
        let currentScope = editorConst.GLOBAL_SOCPE;
        if (apiName.length != 0) {
            var tokens = apiName.split('.');
            currentScope = tokens[0].trim();
        }
        const rawDecl = {};
        tsDef.forEach((item) => {
            rawDecl[item.name] = item;
        });
        let modifiedSI = rawDecl.jsAPICustom.json_value.api;
        let modifiedSIMap = new Map();
        Object.keys(modifiedSI).forEach((sysId) => {
            modifiedSIMap.set(sysId, modifiedSI[sysId]);
        });
        siJSData = rawDecl.jsAPI.json_value.api;
        for (let scopeName in siJSData) {
            if (/[0-9]/.test(scopeName)) {
                //TODO: what is causing sys_id are part of scopes
                delete siJSData[scopeName];
                continue;
            }
            let items = siJSData[scopeName];
            if (!Array.isArray(items) || items.length === 0)
                return;
            let newItems = [];
            items.forEach((item) => {
                var _a;
                modifiedSIMap.delete(item.id);
                if (typeof item.f === 'undefined')
                    return;
                if (modifiedSI[item.id]) {
                    if (modifiedSI[item.id].api === 'delete')
                        return;
                }
                if (modifiedSI[item.id]) {
                    const [apiScope, apiName] = modifiedSI[item.id].api.split('.');
                    if (apiScope != item.api)
                        modifiedSI[item.id].api = apiName;
                }
                let expandedItem = siParser.SITSFormat.expandMinifiedFormat((_a = modifiedSI[item.id]) !== null && _a !== void 0 ? _a : item, scopeName);
                if (expandedItem)
                    newItems.push(expandedItem);
            });
            siJSData[scopeName] = newItems;
        }
        modifiedSIMap.forEach((item) => {
            var _a;
            if (item.api === 'delete')
                return;
            const apiTokens = item.api.split('.');
            let [scopeName, apiName] = apiTokens;
            if (!apiName)
                return;
            if (apiTokens.length > 1)
                item.api = apiName;
            const siItems = siJSData[scopeName] = (_a = siJSData[scopeName]) !== null && _a !== void 0 ? _a : [];
            const expandedItem = siParser.SITSFormat.expandMinifiedFormat(item, scopeName);
            if (expandedItem)
                siItems.push(expandedItem);
        });
        let typeDefMap = siParser.TSChecker.getTypeDefsAsScopeMap(siJSData, sysId);
        let typeDefLibs = siParser.TSChecker.generateTypedefDeclFromScopemap(typeDefMap);
        let defEmittor = new siParser.DefinitionEmittor(siJSData);
        javaAPI = rawDecl.javaGlobalAPI.json_value.api + TokenType.newline + rawDecl.javaGlobalAPI.customization;
        javaScopedAPI = rawDecl.javaScopedAPI.json_value.api + TokenType.newline + rawDecl.javaScopedAPI.customization;
        tableJSONPayload = rawDecl.tableAPI.json_value.api;
        tableCustomization = rawDecl.tableAPI.customization;
        const tableDTS = schemaParser_2.SchemaDTSGenerator.generate(tableJSONPayload.tableMap, tableJSONPayload.choiceMap);
        tableAPI = tableDTS + TokenType.newline + rawDecl.tableAPI.customization;
        jsAPI = defEmittor.emit(currentScope, excludedTypes) + TokenType.newline + rawDecl.jsAPI.customization;
        jsCustomization = rawDecl.jsAPI.customization;
        const tsDefaults = monaco.languages.typescript.typescriptDefaults;
        if (prevScope.length == 0 || prevScope != currentScope && currentScope == editorConst.GLOBAL_SOCPE) {
            if (prevScope.length != 0)
                javaTypeDisposable.dispose();
            if (currentScope == editorConst.GLOBAL_SOCPE)
                javaTypeDisposable = tsDefaults.addExtraLib(javaAPI, editorConst.JAVA_GLOBAL_API);
            else
                javaTypeDisposable = tsDefaults.addExtraLib(javaScopedAPI, editorConst.JAVA_SCOPE_API);
        }
        prevScope = currentScope;
        if (!tableTypeDisposable)
            tableTypeDisposable = tsDefaults.addExtraLib(tableAPI, editorConst.TABLE_API);
        if (jsTypeDeclarationDisposable)
            jsTypeDeclarationDisposable.dispose();
        jsTypeDeclarationDisposable = null;
        jsTypeDeclarationDisposable = tsDefaults.addExtraLib(jsAPI, editorConst.JS_API);
        if (typeDefDeclarationDisposable)
            typeDefDeclarationDisposable.dispose();
        typeDefDeclarationDisposable = null;
        typedefAPI = typeDefLibs;
        if (typeDefLibs.length > 0)
            typeDefDeclarationDisposable = tsDefaults.addExtraLib(typeDefLibs, editorConst.TYPE_DEFS);
    }
    exports.internalInitializeEx = internalInitializeEx;
    function internalInitialize(tsDecl, apiName, sysId, excludedTypes) {
        typeDecl = tsDecl;
        var currentScope = editorConst.GLOBAL_SOCPE;
        if (apiName.length != 0) {
            var tokens = apiName.split('.');
            currentScope = tokens[0].trim();
        }
        var rawDecl = {};
        for (let itemDecl of typeDecl) {
            if (typeof itemDecl.json_value == 'string')
                rawDecl[itemDecl.name] = { api: JSON.parse(itemDecl.json_value).api, customization: itemDecl.customization };
            else
                rawDecl[itemDecl.name] = { api: itemDecl.json_value.api, customization: itemDecl.customization };
        }
        if (!siJSData && !!rawDecl.jsAPI)
            siJSData = rawDecl["jsAPI"].api;
        if (typeof (siJSData) == 'string')
            siJSData = JSON.parse(siJSData + '');
        for (let scopeName in siJSData) {
            let items = siJSData[scopeName];
            items.forEach((item, index, srcArray) => {
                if (typeof item.f != 'undefined') {
                    let expandedItem = siParser.SITSFormat.expandMinifiedFormat(item, scopeName);
                    if (expandedItem)
                        srcArray[index] = expandedItem;
                }
            });
        }
        let typeDefMap = siParser.TSChecker.getTypeDefsAsScopeMap(siJSData, sysId);
        let typeDefLibs = siParser.TSChecker.generateTypedefDeclFromScopemap(typeDefMap);
        let defEmittor = new siParser.DefinitionEmittor(siJSData);
        javaAPI = rawDecl.javaGlobalAPI.api + TokenType.newline + rawDecl.javaGlobalAPI.customization;
        javaScopedAPI = rawDecl.javaScopedAPI.api + TokenType.newline + rawDecl.javaScopedAPI.customization;
        if (typeof rawDecl.tableAPI.api === 'string')
            tableJSONPayload = JSON.parse(rawDecl.tableAPI.api);
        else
            tableJSONPayload = rawDecl.tableAPI.api;
        tableCustomization = rawDecl.tableAPI.customization;
        const tableDTS = schemaParser_2.SchemaDTSGenerator.generate(tableJSONPayload.tableMap, tableJSONPayload.choiceMap);
        //tableAPI = rawDecl.tableAPI.api + TokenType.newline + rawDecl.tableAPI.customization;
        tableAPI = tableDTS + TokenType.newline + rawDecl.tableAPI.customization;
        jsAPI = defEmittor.emit(currentScope, excludedTypes) + TokenType.newline + rawDecl.jsAPI.customization;
        jsCustomization = rawDecl.jsAPI.customization;
        var tsDefaults = monaco.languages.typescript.typescriptDefaults;
        if (prevScope.length == 0 || prevScope != currentScope && currentScope == editorConst.GLOBAL_SOCPE) {
            if (prevScope.length != 0)
                javaTypeDisposable.dispose();
            if (currentScope == editorConst.GLOBAL_SOCPE)
                javaTypeDisposable = tsDefaults.addExtraLib(javaAPI, editorConst.JAVA_GLOBAL_API);
            else
                javaTypeDisposable = tsDefaults.addExtraLib(javaScopedAPI, editorConst.JAVA_SCOPE_API);
        }
        prevScope = currentScope;
        if (!tableTypeDisposable)
            tableTypeDisposable = tsDefaults.addExtraLib(tableAPI, editorConst.TABLE_API);
        if (jsTypeDeclarationDisposable)
            jsTypeDeclarationDisposable.dispose();
        jsTypeDeclarationDisposable = null;
        jsTypeDeclarationDisposable = tsDefaults.addExtraLib(jsAPI, editorConst.JS_API);
        if (typeDefDeclarationDisposable)
            typeDefDeclarationDisposable.dispose();
        typeDefDeclarationDisposable = null;
        typedefAPI = typeDefLibs;
        if (typeDefLibs.length > 0)
            typeDefDeclarationDisposable = tsDefaults.addExtraLib(typeDefLibs, editorConst.TYPE_DEFS);
    }
    exports.internalInitialize = internalInitialize;
    let currentSI;
    function getCurrentSI() {
        return currentSI;
    }
    exports.getCurrentSI = getCurrentSI;
    function getCurrentModuleName() {
        if (isSeismicComponent())
            return editorConst.BOOT_FILE_NAME;
        return currentSI.isJavascript() ? 'point.js' : 'point.ts';
    }
    exports.getCurrentModuleName = getCurrentModuleName;
    let tsDeclForCurrentSI;
    function updateCurrentSIDeclaration(jsDoc = false, val) {
        if (currentSI.isTypescript())
            return;
        if (tsDeclForCurrentSI) {
            tsDeclForCurrentSI.dispose();
            tsDeclForCurrentSI = null;
        }
        if (!currentSI.canGenerateDeclaration() && !isScriptRunner())
            return;
        // FIXME: need more robust solution for this.
        // 1. what if ui thread is not ready to handle this.
        //if (!isWorkerThreadInitialized)
        //	console.warn('worker thread is not initialized');
        if (!val)
            return;
        //generateTypeDeclForSingleRecord().then((val: siParser.SITSFormat) => {
        if (val.tf.length > 0) {
            let content = currentSI.formatCurrentSITSFormat(val);
            tsDeclForCurrentSI = monaco.languages.typescript.typescriptDefaults.addExtraLib(content, "current.d.ts");
        }
    }
    exports.updateCurrentSIDeclaration = updateCurrentSIDeclaration;
    function isJSCacheReady() {
        if (window.recordConfig)
            return window.recordConfig.libVersions.jsLibState;
        if (!window.snMonacoConfig)
            return false;
        return window.snMonacoConfig.libState.jsLibState;
    }
    exports.isJSCacheReady = isJSCacheReady;
    function isSeismicComponent() {
        return window.recordConfig && window.recordConfig.isSeismic;
    }
    exports.isSeismicComponent = isSeismicComponent;
    function isNewFiddle() {
        return window.recordConfig && window.recordConfig.uxfRecord.sys_id === '-1';
    }
    exports.isNewFiddle = isNewFiddle;
    const intellisenseMap = new Map();
    let jsxDefPromise;
    let seismicInfo = { assetLibs: {}, componentLibs: {}, status: 'ok' };
    function getSeismicInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isServiceNow() && isSeismicComponent()) {
                yield loadJSXIntellisense();
                return Promise.resolve(seismicInfo);
            }
            return Promise.resolve({ assetLibs: {}, componentLibs: {}, status: 'ok' });
        });
    }
    exports.getSeismicInfo = getSeismicInfo;
    function getSeismicComponentsModuleTypeDefinitions() {
        //let result = await getSeismicInfo();
        const componentLibs = seismicInfo.componentLibs;
        let lib = '';
        for (const tagName in componentLibs)
            lib += `declare module "${componentLibs[tagName].sys_scope}" {}\n`;
        let libModuleContent = AssetInfoCache.get().getDTS();
        return lib + libModuleContent;
    }
    exports.getSeismicComponentsModuleTypeDefinitions = getSeismicComponentsModuleTypeDefinitions;
    // export function getSeismicComponentAMDLibs() {
    // 	const componentLibs = seismicInfo.componentLibs;
    // 	let amdLib = '';
    // 	for (const tagName in componentLibs)
    // 		amdLib += `define("${componentLibs[tagName].sys_scope}", ['require', 'exports'], function(require, exports) { return {};});\n`;
    // 	return amdLib + AssetInfoCache.get().getAMDLib();
    // }
    function getTectonicGlobalNameForModule(assetName) {
        const tokens = assetName.match(/.+?-(?=[0-9])/);
        let [moduleName] = tokens !== null && tokens !== void 0 ? tokens : [assetName];
        const [name, version] = assetName.split(moduleName);
        const [majorMinorVersion] = version.split('-');
        let versionTokens = majorMinorVersion.split('.');
        let versionStr = versionTokens.join('');
        while (versionStr.length < 5)
            versionStr += '0';
        const intVersion = parseInt(versionStr);
        if (moduleName.endsWith('-'))
            moduleName = moduleName.slice(0, moduleName.length - 1);
        const regUnderScore = /(-|\.|\/)/g;
        const assetNameAfterDotAnd_ = assetName.replace(regUnderScore, '_');
        const assetNameAfter_at = assetNameAfterDotAnd_.replace(/@/g, '$');
        const tectonicGlobalName = '__TECTONIC__' + assetNameAfter_at;
        const assetUrl = '/uxasset/externals/' + assetName + '.jsdbx?sysparm_substitute=false';
        return {
            moduleName,
            assetUrl,
            tectonicGlobalName,
            intVersion,
            majorMinorVersion
        };
    }
    exports.getTectonicGlobalNameForModule = getTectonicGlobalNameForModule;
    class AssetInfo {
        constructor(asset, isPreloaded = false) {
            this.asset = asset;
            this.isPreloaded = isPreloaded;
            const assetName = asset.assetName;
            // const regUnderScore = /(-|\.|\/)/g;
            // const tokens = assetName.match(/.+?-(?=[0-9])/);
            // let [moduleName] = tokens;
            // const [name, version] = assetName.split(moduleName);
            // const [majorMinorVersion] = version.split('-');
            // this.majorMinorVersion = majorMinorVersion;
            // let versionTokens = majorMinorVersion.split('.');
            // let versionStr = versionTokens.join('');
            // while(versionStr.length < 5)
            // 	versionStr += '0';
            // const intVersion = parseInt(versionStr);
            // console.log( moduleName + ' ' + intVersion);
            // this.intVersion = intVersion;
            // if (moduleName.endsWith('-'))
            // 	moduleName = moduleName.slice(0, moduleName.length - 1);
            // const assetNameAfterDotAnd_ = assetName.replace(regUnderScore, '_');
            // const assetNameAfter_at = assetNameAfterDotAnd_.replace(/@/g, '$');
            // const tectonicName = '__TECTONIC__' + assetNameAfter_at;
            // const assetUrl = '/uxasset/externals/' + assetName + '.jsdbx';
            // console.log(`${moduleName} - ${tectonicName} - ${assetUrl}`);
            // this.moduleName = moduleName;
            // this.assetUrl = assetUrl;
            // this.tectonicGlobalName = tectonicName;
            const info = getTectonicGlobalNameForModule(assetName);
            this.assetUrl = info.assetUrl;
            this.intVersion = info.intVersion;
            this.majorMinorVersion = info.majorMinorVersion;
            this.moduleName = info.moduleName;
            this.tectonicGlobalName = info.tectonicGlobalName;
        }
        getDTS() {
            return `declare module "${this.moduleName}" {
			const temp: any;
			export default temp;
		}`;
        }
        getAMD() {
            return `define("${this.moduleName}", ['require', 'exports'], function(require, exports) {
			return window['${this.tectonicGlobalName}'] || {};
		});`;
        }
    }
    exports.AssetInfo = AssetInfo;
    const definedModules = ["@servicenow/ui-core", "@servicenow/ui-renderer-snabbdom",
        "@servicenow/ui-effect-http", "@servicenow/ui-effect-graphql",
        "@servicenow/ui-effect-amb", "sn-translate", "uxf-template-loader", "@devsnc/library-uxf",
        "@servicenow/behavior-fit", "@servicenow/behavior-focus", "@servicenow/behavior-key-binding",
        "@servicenow/behavior-media-query", "@servicenow/behavior-overlay", "@servicenow/behavior-resize",
        "@servicenow/behavior-rtl"];
    let preLoadedModules = [
        "@servicenow/ui-core", "@servicenow/ui-renderer-snabbdom",
        "sn-translate", "uxf-template-loader",
        "@servicenow/ui-effect-http",
        "@servicenow/ui-effect-graphql",
        "@servicenow/ui-effect-amb"
    ];
    preLoadedModules = ["uxf-template-loader"];
    const knownDTSModules = new Set(definedModules);
    class AssetInfoCache {
        constructor() {
            this.latestAssetInfoMap = new Map();
            this.assetInfoVersionMap = new Map();
            preLoadedModules.forEach((moduleName) => {
                this.add({ assetName: moduleName, sys_scope: moduleName }, true);
            });
        }
        static get() {
            if (AssetInfoCache.instance)
                return AssetInfoCache.instance;
            AssetInfoCache.instance = new AssetInfoCache();
            return AssetInfoCache.instance;
        }
        getAssetInfo(moduleName) {
            return this.latestAssetInfoMap.get(moduleName);
        }
        add(asset, isPreloaded = false) {
            let assetInfo = null;
            try {
                assetInfo = new AssetInfo(asset, isPreloaded);
            }
            catch (e) {
                return;
            }
            if (this.latestAssetInfoMap.has(assetInfo.moduleName)) {
                const existingAssetInfo = this.latestAssetInfoMap.get(assetInfo.moduleName);
                if (existingAssetInfo.intVersion < assetInfo.intVersion) {
                    const versionMap = this.assetInfoVersionMap.get(assetInfo.moduleName) || new Map();
                    versionMap.set(existingAssetInfo.intVersion, existingAssetInfo);
                    this.assetInfoVersionMap.set(existingAssetInfo.moduleName, versionMap);
                }
            }
            this.latestAssetInfoMap.set(assetInfo.moduleName, assetInfo);
            if (knownDTSModules.has(assetInfo.moduleName))
                return;
        }
        getDTS() {
            let assetModuleDef = '';
            this.latestAssetInfoMap.forEach((assetInfo, moduleName) => {
                if (knownDTSModules.has(moduleName))
                    return;
                assetModuleDef += assetInfo.getDTS() + '\n';
            });
            return assetModuleDef;
        }
    }
    exports.AssetInfoCache = AssetInfoCache;
    const componentModuleToTagNameMap = new Map();
    function getExternalResults(depModules) {
        let customTags = [];
        let assets = [];
        let amdLibs = '';
        const cacheInstance = AssetInfoCache.get();
        depModules.forEach((moduleName) => {
            if (componentModuleToTagNameMap.has(moduleName)) {
                customTags.push(componentModuleToTagNameMap.get(moduleName));
                const newAssetInfo = new AssetInfo({ sys_scope: moduleName, assetName: moduleName }, true);
                amdLibs += newAssetInfo.getAMD() + '\n';
            }
            else {
                const result = cacheInstance.getAssetInfo(moduleName);
                if (result) {
                    if (!result.isPreloaded)
                        assets.push(result);
                    amdLibs += result.getAMD() + '\n';
                }
                else {
                    const newAssetInfo = new AssetInfo({ sys_scope: moduleName, assetName: moduleName }, true);
                    amdLibs += newAssetInfo.getAMD() + '\n';
                    console.warn(`unable to find "${moduleName}" information creating a dummy one`);
                }
            }
        });
        return {
            customTags,
            amdLibs,
            assets
        };
    }
    exports.getExternalResults = getExternalResults;
    function loadJSXIntellisense() {
        return __awaiter(this, void 0, void 0, function* () {
            if (jsxDefPromise)
                return jsxDefPromise;
            const jsxTypePaths = ['node_modules/@types/react/global.d.ts',
                'node_modules/@types/prop-types/index.d.ts',
                'node_modules/@types/react/index.d.ts',
                'node_modules/csstype/index.d.ts'];
            let seismicBasePath = 'typings/seismic/';
            const ylnSource = 'http://yln:9090';
            const isYlnSource = window.recordConfig.paths.app.indexOf('codenow.debug.js') >= 0;
            if (isYlnSource) {
                const files = ['index.d.ts', 'moduleFormat.d.ts'];
                files.forEach((fileName) => {
                    jsxTypePaths.push(`${seismicBasePath}${fileName}`);
                });
            }
            else
                monaco.languages.typescript.typescriptDefaults.addExtraLib(seismic_1.seismicObj.dts, seismicBasePath);
            let allPromise = jsxTypePaths.map((src) => __awaiter(this, void 0, void 0, function* () {
                let url = '';
                if (isYlnSource || !isServiceNow())
                    url += `${ylnSource}/${src}`;
                else
                    url = src.replace('node_modules', 'https://www.unpkg.com/');
                return fetch(url).then((response) => {
                    return response.text();
                }).then((content) => {
                    intellisenseMap.set(src, content);
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(content, src);
                });
            }));
            if (isServiceNow() && isSeismicComponent()) {
                const defInfo = codenowUtils_2.CodeNowUtils.doAction({ cmd: codenowUtils_2.CodeNowActionTypes.get_seismic_info });
                allPromise.push(defInfo);
                defInfo.then((result) => {
                    seismicInfo = result;
                    Object.keys(seismicInfo.componentLibs).forEach((tagName) => {
                        const componentInfo = seismicInfo.componentLibs[tagName];
                        componentInfo.tagName = tagName;
                        componentModuleToTagNameMap.set(componentInfo.sys_scope, componentInfo.tagName);
                    });
                    const assetKeys = Object.keys(seismicInfo.assetLibs);
                    const assetCache = AssetInfoCache.get();
                    //const regUnderScore = /(-|\.|\/)/g;
                    assetKeys.map((assetName) => {
                        const item = seismicInfo.assetLibs[assetName];
                        item.assetName = assetName;
                        assetCache.add(item);
                        // const tokens = assetName.match(/.+?-(?=[0-9])/);
                        // let [moduleName] = tokens;
                        // if (moduleName.endsWith('-'))
                        // 	moduleName = moduleName.slice(0, moduleName.length - 1);
                        // const assetNameAfterDotAnd_ = assetName.replace(regUnderScore, '_');
                        // const assetNameAfter_at = assetNameAfterDotAnd_.replace(/@/g, '$');
                        // const tectonicName = '__TECTONIC__' + assetNameAfter_at;
                        // const jsName = '/uxasset/externals/' + assetName + '.jsdbx';
                        // console.log(`${moduleName} - ${tectonicName} - ${jsName}`);
                    });
                });
            }
            jsxDefPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(allPromise);
                const libContent = getSeismicComponentsModuleTypeDefinitions();
                const libName = 'seismic_component_lib.d.ts';
                if (libContent.length > 0) {
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(libContent, libName);
                    intellisenseMap.set(libName, libContent);
                }
                resolve(intellisenseMap);
            }));
            return jsxDefPromise;
        });
    }
    exports.loadJSXIntellisense = loadJSXIntellisense;
    function initializeWithSIRecord(thisSI) {
        currentSI = thisSI;
        var promise = new Promise((resolve, reject) => {
            if (isSeismicComponent())
                return resolve();
            tsDeclarations.fetch().then(function (result) {
                let excludedTypes = {};
                if (!currentSI.isNew())
                    excludedTypes[currentSI.sys_id] = true;
                internalInitializeEx(result, currentSI.api_name, currentSI.sys_id, excludedTypes);
                if (isServiceNow())
                    updateCurrentSIDeclaration(false);
                resolve();
            });
        });
        return promise;
    }
    exports.initializeWithSIRecord = initializeWithSIRecord;
    function initializeTypeDeclarations(apiName = '') {
        apiName = apiName || 'global.';
        return new Promise((resolve, reject) => {
            tsDeclarations.fetch().then(function (result) {
                internalInitializeEx(result, apiName, '-1', {});
                resolve();
            });
        });
    }
    exports.initializeTypeDeclarations = initializeTypeDeclarations;
    function getMonacoClientFieldFromCurrentSI() {
        const value = {
            name: 'script',
            ref: 'sys_script_include.script',
            srcValue: currentSI.tsscript,
            transpiledValue: currentSI.script,
            declaration: currentSI.typedeclaration,
            sourcemap: currentSI.typesourcemap
        };
        return value;
    }
    exports.getMonacoClientFieldFromCurrentSI = getMonacoClientFieldFromCurrentSI;
    function getMonacoFieldFromCurrentSI() {
        const monaocField = {
            isDotWalkingField: false,
            tableName: "sys_script_include",
            sysId: currentSI.sys_id,
            internalType: "script_plain",
            name: "script",
            tupleName: "script_js",
            tupleRef: "",
            srcValue: currentSI.tsscript,
            declaration: currentSI.typedeclaration,
            isEditorInitialized: true,
            refParent: 'sys_script_include',
            scriptField: 'script',
            sourcemap: currentSI.typesourcemap,
            srcType: currentSI.isTypescript() ? 'ts' : 'js',
            transpiledValue: currentSI.script,
            ref: "sys_script_include.script",
            fileName: `sys_script_include.script.${currentSI.isTypescript() ? 'ts' : 'js'}`,
            customDeclaration: "",
            canWrite: true,
            canRead: true,
            host: {
                tableName: "sys_script_include",
                sysId: currentSI.sys_id,
                name: "script",
                hostType: "script_plain"
            }
        };
        return monaocField;
    }
    exports.getMonacoFieldFromCurrentSI = getMonacoFieldFromCurrentSI;
    function isTranspiledScript() {
        var _a;
        return !!((_a = window === null || window === void 0 ? void 0 : window.recordConfig) === null || _a === void 0 ? void 0 : _a.isES6);
    }
    exports.isTranspiledScript = isTranspiledScript;
});
define("fileSearch", ["require", "exports", "siDeclEmittor", "siParser"], function (require, exports, declEmittor, siParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    declEmittor = __importStar(declEmittor);
    // LICENSE
    //
    //   This software is dual-licensed to the public domain and under the following
    //   license: you are granted a perpetual, irrevocable license to copy, modify,
    //   publish, and distribute this file as you see fit.
    //
    // VERSION 
    //   0.1.0  (2016-03-28)  Initial release
    //
    // AUTHOR
    //   Forrest Smith
    //
    // CONTRIBUTORS
    //   J�rgen Tjern� - async helper
    // Returns true if each character in pattern is found sequentially within str
    function fuzzy_match_simple(pattern, str) {
        var patternIdx = 0;
        var strIdx = 0;
        var patternLength = pattern.length;
        var strLength = str.length;
        while (patternIdx != patternLength && strIdx != strLength) {
            var patternChar = pattern.charAt(patternIdx).toLowerCase();
            var strChar = str.charAt(strIdx).toLowerCase();
            if (patternChar == strChar)
                ++patternIdx;
            ++strIdx;
        }
        return patternLength != 0 && strLength != 0 && patternIdx == patternLength ? true : false;
    }
    // Returns [bool, score, formattedStr]
    // bool: true if each character in pattern is found sequentially within str
    // score: integer; higher is better match. Value has no intrinsic meaning. Range varies with pattern. 
    //        Can only compare scores with same search pattern.
    // formattedStr: input str with matched characters marked in <b> tags. Delete if unwanted.
    function fuzzy_match(pattern, str) {
        // Score consts
        var adjacency_bonus = 5; // bonus for adjacent matches
        var separator_bonus = 10; // bonus if match occurs after a separator
        var camel_bonus = 10; // bonus if match is uppercase and prev is lower
        var leading_letter_penalty = -3; // penalty applied for every letter in str before the first match
        var max_leading_letter_penalty = -9; // maximum penalty for leading letters
        var unmatched_letter_penalty = -1; // penalty for every letter that doesn't matter
        // Loop variables
        var score = 0;
        var patternIdx = 0;
        var patternLength = pattern.length;
        var strIdx = 0;
        var strLength = str.length;
        var prevMatched = false;
        var prevLower = false;
        var prevSeparator = true; // true so if first letter match gets separator bonus
        // Use "best" matched letter if multiple string letters match the pattern
        var bestLetter = null;
        var bestLower = null;
        var bestLetterIdx = null;
        var bestLetterScore = 0;
        var matchedIndices = [];
        // Loop over strings
        while (strIdx != strLength) {
            var patternChar = patternIdx != patternLength ? pattern.charAt(patternIdx) : null;
            var strChar = str.charAt(strIdx);
            var patternLower = patternChar != null ? patternChar.toLowerCase() : null;
            var strLower = strChar.toLowerCase();
            var strUpper = strChar.toUpperCase();
            var nextMatch = patternChar && patternLower == strLower;
            var rematch = bestLetter && bestLower == strLower;
            var advanced = nextMatch && bestLetter;
            var patternRepeat = bestLetter && patternChar && bestLower == patternLower;
            if (advanced || patternRepeat) {
                score += bestLetterScore;
                matchedIndices.push(bestLetterIdx);
                bestLetter = null;
                bestLower = null;
                bestLetterIdx = null;
                bestLetterScore = 0;
            }
            if (nextMatch || rematch) {
                var newScore = 0;
                // Apply penalty for each letter before the first pattern match
                // Note: std::max because penalties are negative values. So max is smallest penalty.
                if (patternIdx == 0) {
                    var penalty = Math.max(strIdx * leading_letter_penalty, max_leading_letter_penalty);
                    score += penalty;
                }
                // Apply bonus for consecutive bonuses
                if (prevMatched)
                    newScore += adjacency_bonus;
                // Apply bonus for matches after a separator
                if (prevSeparator)
                    newScore += separator_bonus;
                // Apply bonus across camel case boundaries. Includes "clever" isLetter check.
                if (prevLower && strChar == strUpper && strLower != strUpper)
                    newScore += camel_bonus;
                // Update patter index IFF the next pattern letter was matched
                if (nextMatch)
                    ++patternIdx;
                // Update best letter in str which may be for a "next" letter or a "rematch"
                if (newScore >= bestLetterScore) {
                    // Apply penalty for now skipped letter
                    if (bestLetter != null)
                        score += unmatched_letter_penalty;
                    bestLetter = strChar;
                    bestLower = bestLetter.toLowerCase();
                    bestLetterIdx = strIdx;
                    bestLetterScore = newScore;
                }
                prevMatched = true;
            }
            else {
                // Append unmatch characters
                formattedStr += strChar;
                score += unmatched_letter_penalty;
                prevMatched = false;
            }
            // Includes "clever" isLetter check.
            prevLower = strChar == strLower && strLower != strUpper;
            prevSeparator = strChar == '_' || strChar == ' ';
            ++strIdx;
        }
        // Apply score for last match
        if (bestLetter) {
            score += bestLetterScore;
            matchedIndices.push(bestLetterIdx);
        }
        // Finish out formatted string after last pattern matched
        // Build formated string based on matched letters
        var formattedStr = "";
        var lastIdx = 0;
        for (var i = 0; i < matchedIndices.length; ++i) {
            var idx = matchedIndices[i];
            //formattedStr += str.substr(lastIdx, idx - lastIdx) + "<span class='highlight'>" + str.charAt(idx) + "</span>";
            let noMatch = str.substr(lastIdx, idx - lastIdx);
            let match = str.charAt(idx);
            formattedStr += `<span class = "no-match">${noMatch}</span><span class='highlight'>${match}</span>`;
            lastIdx = idx + 1;
        }
        if ((str.length - lastIdx) != 0)
            formattedStr += `<span class="no-match">${str.substr(lastIdx, str.length - lastIdx)}</span>`;
        var matched = patternIdx == patternLength;
        return [matched, score, formattedStr];
    }
    // Strictly optional utility to help make using fts_fuzzy_match easier for large data sets
    // Uses setTimeout to process matches before a maximum amount of time before sleeping
    //
    // To use:
    //      var asyncMatcher = new fts_fuzzy_match(fuzzy_match, "fts", "ForrestTheWoods", 
    //                                              function(results) { console.log(results); });
    //      asyncMatcher.start();
    //
    function fts_fuzzy_match_async(matchFn, pattern, onComplete) {
        var ITEMS_PER_CHECK = 1000; // performance.now can be very slow depending on platform
        var max_ms_per_frame = 1000.0 / 30.0; // 30FPS
        var dataIndex = 0;
        var results = [];
        var resumeTimeout = null;
        // Perform matches for at most max_ms
        function step() {
            clearTimeout(resumeTimeout);
            resumeTimeout = null;
            var stopTime = performance.now() + max_ms_per_frame;
            var siMap = declEmittor.getSIMap();
            for (var ns in siMap) {
                let items = siMap[ns];
                for (var i = 0; i < items.length; i++) {
                    let tokens = items[i].api.split('.');
                    let simpleName = tokens[0];
                    if (tokens.length == 2)
                        items[i].api.split('.')[1];
                    let result = matchFn(pattern, simpleName);
                    if (matchFn == fuzzy_match && result[0] != true)
                        continue;
                    results.push({
                        rank: result[1],
                        matchStr: result[2],
                        item: items[i]
                    });
                }
            }
            // for (; dataIndex < dataSet.length; ++dataIndex) {
            // 	if ((dataIndex % ITEMS_PER_CHECK) == 0) {
            // 		if (performance.now() > stopTime) {
            // 			resumeTimeout = setTimeout(step, 1);
            // 			return;
            // 		}
            // 	}
            // 	var str = dataSet[dataIndex].apiName.split('.')[1];
            // 	var result = matchFn(pattern, str);
            // 	// A little gross because fuzzy_match_simple and fuzzy_match return different things
            // 	if (matchFn == fuzzy_match_simple && result == true)
            // 		results.push(str);
            // 	else if (matchFn == fuzzy_match && result[0] == true)
            // 		results.push(result);
            // }
            onComplete(results);
            return null;
        }
        ;
        // Abort current process
        this.cancel = function () {
            if (resumeTimeout !== null)
                clearTimeout(resumeTimeout);
        };
        // Must be called to start matching.
        // I tried to make asyncMatcher auto-start via "var resumeTimeout = step();"
        // However setTimout behaving in an unexpected fashion as onComplete insisted on triggering twice.
        this.start = function () {
            step();
        };
        // Process full list. Blocks script execution until complete
        this.flush = function () {
            max_ms_per_frame = Infinity;
            step();
        };
    }
    ;
    class FileSearchOverlay {
        constructor(domNode) {
            this.domNode = domNode;
            this.id = "FileSearch";
        }
        getId() {
            return this.id;
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            return null;
        }
    }
    class FileSearchItem {
        constructor(name) {
            this.name = name;
        }
        update(filter) {
        }
    }
    var jsImgTag = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4gcPDwoiWcgyPAAAAh5JREFUSMfV1U2IjWEUB/Df/aDBVVj4mHEZnwmFBVGWdthJESGEUrOSpTWRKERNYqwsSKJ8pGztrCjF1FgIibi5GMPiOdc83ebOZXb+9fae53nOec/X/zkv/zsKI23WB7pbGnRU+0c9b9YdzUEJMzEev/AOtSbVMqqYFTpvMIDBXKEVpqEPi8OgB7ey8yU4gg2hCx/wCMfxvJ2DErrigUnZ2QJcwZommwp2Yzl24nmxTRl/xXsok2Ff9vEaHuIBvsTefCxtl0ErTMS6bN2LoxHAXmzEKTz+GwcjkaCEjmz9BvWQL0Xp/pChXYlGwleJKQ0cwB6p0YP5xzuq/aM6KLTYH8QNfI/1XFzEHRxGZ0OxPtA9pgzgJk7jW6zHYS3O4i52xF5bB3kWOYvqOIb9eGL4YhWwQupFD4pjzUBE3yexZg/uG272BOkSri//7VxpyiDHe1yLsm3DCUzFdGzKM1goNSwvT34+lMmzcQjzsr0aLkfJGugqhreDUnPOSiwoYjVmhOIPfAx5C27jPM5gmdTQElZJt7iBD2VpWJ2UZs1CzMHrUK6EYj+ehbwIK0PeHPJT/AybOXH2GQ/K0gy5Ho0qhMHKLIofuBBO4Zw0ovdF5NV4cgxJTLpXiCZPkS7J9lAeL7HkZSj2GuY8aR5txa4o0eQI7ite4Gr0o1ZoYlFnNK6CT+HgrdaooFtiTEn6H7yKd2LKv/z+GhiLzf+L3xLMgT1r10J2AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTA3LTE1VDEzOjEwOjM0KzAyOjAwRXld0gAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wNy0xNVQxMzoxMDozNCswMjowMDQk5W4AAAAASUVORK5CYII=" alt="" />`;
    var tsImgTag = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAPCAMAAADXs89aAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABOFBMVEVCpfX///9CpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfVCpfX///8Jns0AAAAAZnRSTlMAAEx9fn98eAcsiqeURr0SAkTi+HQOmtTTz+ff0Agg6uu25jIWKCYhYSInUvV1Q1kLZD5XbvryVm1ezUkxuu38XwYw7vNjRSOTrBCp+cQ6Kp0Pw7zW/r9yThOHszaIgCQFjqWbaBXwbi/OAAAAAWJLR0QB/wIt3gAAAAd0SU1FB+MCDg4uBi7hZswAAAABb3JOVAHPoneaAAAA2klEQVQY022QaVcBcRTGb/4TlUhkUKSpUGNsMVH2Jdq0b5Rdz/f/CGYmh8nxe3Gf5/ze3HsuGRjjuFXGmNG0RrS+Yd60kIIVM7Zs23YlHDtOIt7l9uwCe163x7fvx4FwCBwRHQeCIQ44ORWDFIYUoSgfi5NGAjhTMwkHR3NSgLZHlHEupGc6M9W2CxmQLrMLmiiXLwDFUnlBE1XMVdSu/ut6QxnXwI1e397dNx98jwLwpL/k+QWwv7694yOn6U/gS81WW1Kf8B36W/PT6fa00q8PhqPxr9JWljIBIUAu3lTAeuwAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMDItMTRUMTQ6NDY6MDYrMDA6MDBwkCElAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTAyLTE0VDE0OjQ2OjA2KzAwOjAwAc2ZmQAAAABJRU5ErkJggg==" alt="" />';
    class FileSearch {
        constructor(editor, callback) {
            this.editor = editor;
            this.callback = callback;
            this.id = "FileSearch";
            this.fileSearchWrapper = 'FileSearch-filesWrapper';
            this.fileSearchInput = 'FileSearch-searchInput';
            this.domNode = document.createElement("div");
            this.domNode.setAttribute("id", this.id);
            this.domNode.setAttribute('class', this.id);
            this.filterTimerId = -1;
            this.nextResultTimerId = -1;
            this.currentIndex = 0;
        }
        getNode() {
            return this.domNode;
        }
        close() {
        }
        static isActive() {
            return FileSearch.isOpen;
        }
        dispose() {
            FileSearch.isOpen = false;
            this.domNode.removeEventListener("click", this);
            this.domNode.removeEventListener("keydown", this);
            this.domNode.removeEventListener("mousewheel", this);
            document.removeEventListener("keydown", this);
            this.editor.removeOverlayWidget(this.overlayWidget);
            this.editor.focus();
        }
        handleEvent(e) {
            if (e.type == 'mousewheel') {
                e.stopImmediatePropagation();
                e.stopPropagation();
                return;
            }
            let $scrollEl;
            let childs;
            if (e.type == 'keydown') {
                var keydownEvent = e;
                if (keydownEvent.keyCode == 27 || keydownEvent.keyCode == 13) {
                    if (keydownEvent.keyCode == 13) {
                        $scrollEl = jQuery(this.domNode).find('#FileSearch-filesWrapper');
                        childs = $scrollEl.children();
                        if (this.currentIndex < childs.length) {
                            let sysId = childs[this.currentIndex].getAttribute('data-sysid');
                            let apiName = childs[this.currentIndex].getAttribute('data-apiname');
                            this.callback({ apiName: apiName, sysId: sysId });
                        }
                    }
                    keydownEvent.stopImmediatePropagation();
                    keydownEvent.stopPropagation();
                    keydownEvent.preventDefault();
                    this.dispose();
                    return;
                }
                else if (keydownEvent.keyCode == 40 || keydownEvent.keyCode == 38) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    e.preventDefault();
                    //console.log(' index = ' + this.currentIndex);
                    $scrollEl = jQuery(this.domNode).find('#FileSearch-filesWrapper');
                    childs = $scrollEl.children();
                    let prevIndex = this.currentIndex;
                    if (keydownEvent.keyCode == 40) {
                        // if (this.currentIndex == childs.length - 1)
                        // 	return;
                        this.currentIndex++;
                    }
                    else {
                        // if (this.currentIndex == 0)
                        // 	return;
                        this.currentIndex--;
                        if (this.currentIndex < 0)
                            this.currentIndex = childs.length - 1;
                    }
                    this.currentIndex = this.currentIndex % childs.length;
                    if (prevIndex >= 0)
                        jQuery(childs[prevIndex]).removeClass('selected');
                    jQuery(childs[this.currentIndex]).addClass('selected');
                    if (!FileSearch.itemHieght && childs.length > 0)
                        FileSearch.itemHieght = childs[0].getBoundingClientRect().height;
                    let itemHeight = (FileSearch.itemHieght || 23);
                    let calculatedTop = itemHeight * this.currentIndex;
                    let height = $scrollEl.height();
                    let scrollTop = $scrollEl.scrollTop();
                    if (keydownEvent.keyCode == 38) {
                        calculatedTop = Math.floor(calculatedTop);
                        if (calculatedTop >= scrollTop && calculatedTop < (height + scrollTop))
                            return;
                        //if (calculatedTop < scrollTop)
                        $scrollEl.scrollTop(calculatedTop);
                    }
                    else {
                        let calculatedBottom = Math.ceil(calculatedTop + itemHeight);
                        if (calculatedBottom >= scrollTop && calculatedBottom < (height + scrollTop))
                            return;
                        // if (calculatedTop > (height - itemHeight))
                        // 	$scrollEl.scrollTop(calculatedTop - (height - itemHeight));
                        //if(calculatedBottom )
                        $scrollEl.scrollTop(calculatedBottom - height);
                    }
                    return;
                }
                let code = keydownEvent.keyCode;
                let isValid = (code > 47 && code < 58) || (code > 64 && code < 91) || (code > 96 && code < 123) || code == 8 || code == 13;
                if (!isValid)
                    return;
                var inputEl = this.domNode.querySelector('#' + this.fileSearchInput);
                if (this.filterTimerId != -1) {
                    window.clearTimeout(this.filterTimerId);
                    this.filterTimerId = -1;
                }
                if (this.nextResultTimerId != -1)
                    window.clearTimeout(this.nextResultTimerId);
                this.nextResultTimerId = -1;
                this.filterTimerId = window.setTimeout(() => {
                    this.filter(inputEl.value);
                }, 100);
                return;
            }
            var el = e.target;
            var itemEl = el.closest("div.FileSearch-file");
            if (itemEl != null) {
                let apiName = itemEl.dataset['apiname'];
                let sysId = itemEl.dataset["sysid"];
                this.dispose();
                //console.log(`you clicked on ${apiName} and ${sysId}`);
                this.callback({ apiName: apiName, sysId: sysId });
                return;
            }
            if (el.closest("div#FileSearch") == null)
                this.dispose();
            //console.log(e.type);
        }
        open() {
            FileSearch.isOpen = true;
            this.domNode.innerHTML = this.constructHTML();
            this.domNode.addEventListener("click", this);
            this.domNode.addEventListener("keydown", this);
            this.domNode.addEventListener("mousewheel", this);
            document.addEventListener("keydown", this);
            //document.addEventListener("click", this);
            this.overlayWidget = new FileSearchOverlay(this.domNode);
            this.editor.addOverlayWidget(this.overlayWidget);
            this.domNode.querySelector("#" + this.fileSearchInput).focus();
        }
        filter(filter) {
            var fileSearchWrapper = this.domNode.querySelector('#' + this.fileSearchWrapper);
            let result = this.constructItems(filter);
            this.currentIndex = -1;
            if (!!result)
                fileSearchWrapper.innerHTML = result;
        }
        constructItemsUsingFuzzy(filter, maxCount = 50) {
            if (!!this.asyncMatcher) {
                this.asyncMatcher.cancel();
                this.asyncMatcher = undefined;
            }
            this.asyncMatcher = new fts_fuzzy_match_async(fuzzy_match, filter, (results) => {
                // Scored function requires sorting
                results = results.sort(function (a, b) { return b.rank - a.rank; });
                let count = 0;
                let str = '';
                let nextResultSet = '';
                for (let item of results) {
                    let imgTag = jsImgTag;
                    if (siParser_1.SITSFormat.isTypescript(item.item.f))
                        imgTag = tsImgTag;
                    let itemStr = `<div class="FileSearch-file" data-apiname="${item.item.api}" data-sysId="${item.item.id}">
					${imgTag}<span class="normName">${item.matchStr}</span></div>`;
                    if (count > maxCount) {
                        nextResultSet += itemStr;
                        continue;
                    }
                    count++;
                    str += itemStr;
                }
                //window['nextResultSet'] = nextResultSet;
                var fileSearchWrapper = this.domNode.querySelector('#' + this.fileSearchWrapper);
                this.currentIndex = -1;
                fileSearchWrapper.innerHTML = str;
                let $scrollEl = jQuery(this.domNode).find('#FileSearch-filesWrapper');
                setTimeout(() => {
                    $scrollEl.scrollTop(0);
                }, 0);
                // this.nextResultTimerId = window.setTimeout(() => {
                // 	jQuery(nextResultSet).appendTo($scrollEl);
                // }, 200);
                this.appendNextResultSet(nextResultSet);
            });
            this.asyncMatcher.start();
        }
        appendNextResultSet(nextResultSet) {
            if (nextResultSet.length == 0)
                return;
            var fileSearchWrapper = this.domNode.querySelector('#' + this.fileSearchWrapper);
            this.nextResultTimerId = window.setTimeout(() => {
                jQuery(nextResultSet).appendTo(fileSearchWrapper);
            }, 200);
        }
        constructItems(filter, maxCount = 50) {
            if (filter.length > 0)
                return this.constructItemsUsingFuzzy(filter);
            var str = '';
            var resultCount = 0;
            // if (filter.length != 0)
            // 	maxCount = Math.max(filter.length * maxCount, 50);
            if (maxCount < 0)
                maxCount = 50;
            maxCount = Math.max(maxCount, 50);
            var rx = new RegExp(filter, "gi");
            var siMap = declEmittor.getSIMap();
            let nextResultSet = '';
            for (var ns in siMap) {
                var items = siMap[ns];
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var parts = item.api.split(".");
                    var apiName = parts[0];
                    if (parts.length > 1)
                        apiName = parts[1];
                    if (!filter || apiName.match(rx) != null) {
                        resultCount++;
                        var imgTag = jsImgTag;
                        if (siParser_1.SITSFormat.isTypescript(item.f))
                            imgTag = tsImgTag;
                        let itemStr = `<div class="FileSearch-file" data-apiname="${item.api}" data-sysId="${item.id}">${imgTag}<span class="normName">${apiName}</span></div>`;
                        if (resultCount >= maxCount)
                            nextResultSet += itemStr;
                        else
                            str += itemStr;
                    }
                }
            }
            this.appendNextResultSet(nextResultSet);
            return str;
        }
        constructHTML() {
            var itemHtml = this.constructItems("");
            var str = `<div class="FileSearch-searchWrapper">
					<input type="text" class="FileSearch-searchInput" id="FileSearch-searchInput" autocorrect="off" autocapitalize="off" spellcheck="false" autocomplete="off">
				</div>
				<div class="FileSearch-filesWrapper" id="FileSearch-filesWrapper">
				${itemHtml}
			</div>`;
            return str;
        }
    }
    exports.FileSearch = FileSearch;
    FileSearch.isOpen = false;
});
define("monacoField", ["require", "exports", "codenowUtils", "siDeclEmittor", "debugPointManager"], function (require, exports, codenowUtils_3, siDecl, debugPointManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    siDecl = __importStar(siDecl);
    /// @ts-ignore
    let codenowCustomEvent = CustomEvent;
    var fsExtension;
    (function (fsExtension) {
        fsExtension["js"] = "javascript";
        fsExtension["jsx"] = "javascript";
        fsExtension["ts"] = "typescript";
        fsExtension["tsx"] = "typescript";
        fsExtension["html"] = "html";
        fsExtension["css"] = "css";
        fsExtension["xml"] = "xml";
        fsExtension["json"] = "json";
    })(fsExtension || (fsExtension = {}));
    var DebugPointOperation;
    (function (DebugPointOperation) {
        DebugPointOperation[DebugPointOperation["set"] = 0] = "set";
        DebugPointOperation[DebugPointOperation["add"] = 1] = "add";
    })(DebugPointOperation || (DebugPointOperation = {}));
    class MonacoEditor {
        constructor(el, monacoField) {
            this.el = el;
            this.monacoField = monacoField;
            let tokens = monacoField.fileName.split('.');
            this.internalSave = false;
            let langType = fsExtension.js;
            this.decorationSet = new Set();
            if (this.hasTranspiler())
                langType = fsExtension[monacoField.srcType];
            if (tokens.length > 0)
                langType = fsExtension[tokens[tokens.length - 1]];
            let modelLangType = langType;
            switch (modelLangType) {
                case fsExtension.js:
                case fsExtension.jsx:
                case fsExtension.ts:
                case fsExtension.tsx:
                    modelLangType = fsExtension.ts;
                    break;
                case fsExtension.xml:
                case fsExtension.html:
                    modelLangType = fsExtension.html;
                    break;
            }
            this.oldDecorations = [];
            this.model = monaco.editor.createModel(monacoField.srcValue, modelLangType, monaco.Uri.file(monacoField.fileName));
            this.editor = monaco.editor.create(el, {
                model: this.model,
                glyphMargin: true,
                language: modelLangType,
                fontSize: 16,
                formatOnType: true,
                lineNumbersMinChars: 2,
                formatOnPaste: true,
            }, {
                openerService: siDecl.gotoDefintionService
            });
            this.editor.onMouseDown(e => {
                if (e.target.type == monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && e.event.leftButton) {
                    if (!MonacoUtils.isNew() && e.target.position.column === 1)
                        this.onDebuggerMarginClick(e.target.position.lineNumber, e.target.position.column);
                }
            });
            const thisInstance = this;
            this.editor.addAction({
                id: 'debugger',
                label: 'Open Debugger',
                contextMenuGroupId: 'modification',
                contextMenuOrder: 2.5,
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F8],
                run(ed) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const fieldName = codenowUtils_3.getFieldNameFromMonacoField(thisInstance.monacoField);
                        debugPointManager_1.DebugPointManager.get().startDebugger(MonacoUtils.getTableName(), MonacoUtils.getSysId(), fieldName);
                    });
                }
            });
            if (this.hasTranspiler()) {
                this.editor.addAction({
                    id: 'Save',
                    label: 'Save',
                    contextMenuGroupId: 'modification',
                    contextMenuOrder: 2.5,
                    keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S
                    ],
                    run(ed) {
                        thisInstance.onSave();
                    }
                });
                this.editor.addAction({
                    id: 'SaveAll',
                    label: 'Save All',
                    contextMenuGroupId: 'modification',
                    contextMenuOrder: 3.0,
                    keybindings: [
                        monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S
                    ],
                    run() {
                        thisInstance.onSaveAll();
                    }
                });
            }
            this.editor.onDidChangeModelContent(() => {
                g_form.fieldChanged(this.monacoField.ref, true);
                this.onValueChanged();
            });
        }
        toggleDebugPoints(toBeToggled, operation = DebugPointOperation.set) {
            if (!Array.isArray(toBeToggled))
                return;
            if (operation === DebugPointOperation.add) {
                const toggleSet = new Set(toBeToggled);
                const deltaDecorations = this.model.getAllDecorations();
                const debugDeltaDecorations = deltaDecorations.filter(d => this.decorationSet.has(d.id));
                const existingSet = new Set(debugDeltaDecorations.map(d => d.range.startLineNumber));
                const intersection = toBeToggled.filter(line => existingSet.has(line));
                intersection.forEach((line) => {
                    toggleSet.delete(line);
                    existingSet.delete(line);
                });
                toBeToggled = [...Array.from(toggleSet), ...Array.from(existingSet)];
            }
            const lineCount = this.model.getLineCount();
            toBeToggled = toBeToggled.filter(line => line <= lineCount);
            const decorators = toBeToggled.map((line) => {
                const decor = {
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                        glyphMarginClassName: "dbg-breakpoint",
                        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                    }
                };
                return decor;
            });
            this.oldDecorations = this.editor.deltaDecorations(this.oldDecorations, decorators);
            this.decorationSet = new Set(this.oldDecorations);
        }
        isGlideVar() {
            return this.monacoField.host.hostType === codenowUtils_3.FieldType.GlideVar;
        }
        onDebuggerMarginClick(line, column = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                // TODO: Need more investigation about this
                const tableName = this.isGlideVar() ? this.monacoField.host.tableName : this.monacoField.tableName;
                const sysId = this.isGlideVar() ? this.monacoField.host.sysId : this.monacoField.sysId;
                const name = this.isGlideVar() ? this.monacoField.host.name : this.monacoField.name;
                const result = yield MonacoUtils.toggleDebugPoint(tableName, sysId, name, line);
                const newDebugPoints = Object.keys(result.debugpoints.BREAKPOINT).map((line) => {
                    return parseInt(line);
                });
                //this.toggleDebugPoints([line]);
                this.toggleDebugPoints(newDebugPoints, DebugPointOperation.set);
            });
        }
        onSave() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    MonacoUtils.save(yield this.getBackendValue());
                    g_form.addInfoMessage("Successfully saved");
                }
                catch (e) {
                    g_form.addErrorMessage('Unable to save the value');
                }
            });
        }
        onSaveAll() {
            return __awaiter(this, void 0, void 0, function* () {
            });
        }
        hasTranspiler() {
            return (void 0 !== this.monacoField.srcType);
        }
        getLanguageServiceOutput() {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const worker = yield monaco.languages.typescript.getTypeScriptWorker();
                const client = yield worker(this.model.uri);
                const output = yield client.getEmitOutput(this.model.uri.toString());
                if (output.emitSkipped) {
                    Promise.all([client.getSyntacticDiagnostics(this.model.uri.toString()),
                        client.getSemanticDiagnostics(this.model.uri.toString())]).then((values) => {
                        reject({ syntacticDiagnostics: values[0], semanticDiagnostics: values[1] });
                    });
                    return;
                }
                resolve(output);
            }));
        }
        updateTranspilerOutput() {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield this.getLanguageServiceOutput();
                result.outputFiles.forEach((item) => {
                    if (item.name.endsWith('.d.ts'))
                        this.monacoField.declaration = item.text;
                    else if (item.name.endsWith('.js.map'))
                        this.monacoField.sourcemap = item.text;
                    else if (item.name.endsWith('.js'))
                        this.monacoField.transpiledValue = item.text;
                });
            });
        }
        isFromEditorSave() {
            return this.internalSave;
        }
        updateModelValue(value) {
            if (this.internalSave)
                return;
            this.model.setValue(value);
        }
        onValueChanged() {
            if (!this.hasTranspiler()) {
                this.internalSave = true;
                try {
                    g_form.setValue(this.monacoField.ref, this.model.getValue());
                }
                finally {
                    this.internalSave = false;
                }
                this.monacoField.transpiledValue = this.model.getValue();
                return;
            }
            this.updateTranspilerOutput();
        }
        getValue() {
            return {
                value: this.hasTranspiler() ? this.monacoField.transpiledValue : this.model.getValue()
            };
        }
        getDebugPointKey() {
            if (MonacoUtils.isNew())
                return undefined;
            if (this.isGlideVar())
                return `${this.monacoField.host.tableName}.${this.monacoField.host.sysId}.${this.monacoField.host.name}`;
            return debugPointManager_1.DebugPointManager.get().getKey(this.monacoField.tableName, this.monacoField.sysId, this.monacoField.name);
        }
        getMonacoField() {
            return Object.assign({}, this.monacoField);
        }
        getBackendValue() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.updateTranspilerOutput();
                return {
                    ref: this.monacoField.ref,
                    host: Object.assign({}, this.monacoField.host),
                    name: this.monacoField.name,
                    srcValue: this.model.getValue(),
                    declaration: this.monacoField.declaration,
                    sourcemap: this.monacoField.sourcemap,
                    transpiledValue: this.monacoField.transpiledValue
                };
            });
        }
    }
    exports.MonacoEditor = MonacoEditor;
    let isJSXTypedefLoaded = false;
    const externalDeclarations = new Map();
    class MonacoJSXEditor extends MonacoEditor {
        constructor(el, monacoField) {
            super(el, monacoField);
            MonacoJSXEditor.loadJSXTypedefs();
        }
        static loadJSXTypedefs() {
            if (isJSXTypedefLoaded)
                return;
            isJSXTypedefLoaded = true;
            const jsxTypeDefs = ['node_modules/@types/react/global.d.ts',
                'node_modules/@types/prop-types/index.d.ts',
                'node_modules/@types/react/index.d.ts',
                'node_modules/csstype/index.d.ts'];
            jsxTypeDefs.forEach((src) => {
                const url = src.replace('node_modules', 'https://www.unpkg.com/');
                fetch(url).then((response) => {
                    return response.text();
                }).then((content) => {
                    externalDeclarations.set(src, content);
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(content, src);
                });
            });
        }
        onValueChanged() {
            monaco.languages.typescript.getTypeScriptWorker().then((worker) => {
                worker(this.model.uri).then((client) => {
                    let p = client.getEmitOutput(this.model.uri.toString());
                    p.then((output) => {
                        if (output.emitSkipped)
                            return;
                        this.js = output.outputFiles[0].text;
                        if (typeof g_form === 'undefined')
                            return;
                        g_form.setValue(this.monacoField.ref, this.model.getValue());
                        g_form.setValue(this.monacoField.tupleName, this.js);
                    });
                });
            });
        }
        getValue() {
            return {
                jsx: this.js,
                value: this.model.getValue()
            };
        }
    }
    exports.MonacoJSXEditor = MonacoJSXEditor;
    class MonacoUtils {
        static toggleDebugPoint(tableName, sysId, fieldName, line, column = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                return debugPointManager_1.DebugPointManager.get().toggleDebugPoint(tableName, sysId, fieldName, line);
            });
        }
        static getMonacoInstance(name) {
            return MonacoUtils.instanceMap.get(name);
        }
        static initMonacoForOthers(config) {
            const snMonacoConfig = MonacoUtils.snMonacoConfig = config || {};
            snMonacoConfig.fieldMap = new Map();
            let customeDecl = '';
            if (typeof snMonacoConfig.customDeclaration === 'string')
                customeDecl += snMonacoConfig.customDeclaration + '\n';
            if (Array.isArray(snMonacoConfig.fields)) {
                snMonacoConfig.fields.forEach((field) => {
                    if (typeof field.customDeclaration === 'string')
                        customeDecl += field.customDeclaration + '\n';
                    snMonacoConfig.fieldMap.set(field.ref, field);
                });
            }
            function hideOldUI(id) {
                let el = document.getElementById(id);
                if (el) {
                    el.classList.add('sn_original_editor');
                    return;
                }
                window.setTimeout(hideOldUI, 100, id);
            }
            function initializeEditors(isDebugPointLoaded = true) {
                snMonacoConfig.fields.forEach((field) => {
                    if (field.isEditorInitialized)
                        return;
                    if (!(field.canRead || field.canWrite)) {
                        field.isEditorInitialized = true;
                        return;
                    }
                    let textEl = document.getElementById(field.ref);
                    if (textEl) {
                        if (textEl.offsetWidth === 0 && textEl.offsetHeight == 0)
                            return;
                    }
                    let monacoEl = document.getElementById('monaco_' + field.ref);
                    let fieldIdToHide = 'element.' + field.ref;
                    if (!monacoEl) {
                        //TODO: remove this. it will never get called. 
                        let parentSectionEl = document.getElementById('element.' + field.ref);
                        if (!parentSectionEl)
                            return;
                        let fieldSetEl = document.createElement('fieldset');
                        let div = document.createElement('div');
                        div.setAttribute("oncontextmenu", "return elementAction(this, event)");
                        div.setAttribute('data-type', 'label');
                        div.setAttribute('type', field.internalType);
                        div.setAttribute('id', `label.${field.ref}`);
                        let legend = document.createElement('legend');
                        legend.textContent = field.name;
                        div.appendChild(legend);
                        fieldSetEl.appendChild(div);
                        monacoEl = document.createElement('div');
                        monacoEl.classList.add('sn_monaco_editor');
                        monacoEl.setAttribute('file-name', field.fileName);
                        monacoEl.setAttribute('id', 'monaco_' + field.ref);
                        legend.appendChild(monacoEl);
                        fieldIdToHide = field.ref;
                        parentSectionEl.insertBefore(fieldSetEl, parentSectionEl.firstChild);
                    }
                    field.isEditorInitialized = true;
                    let instance;
                    if (field.internalType === 'jsx' || field.internalType === 'tsx')
                        instance = new MonacoJSXEditor(monacoEl, field);
                    else
                        instance = new MonacoEditor(monacoEl, field);
                    MonacoUtils.instanceMap.set(field.ref, instance);
                    if (isDebugPointLoaded) {
                        const debugPoints = debugPointManager_1.DebugPointManager.get().getDebugLineNumbers(instance.getDebugPointKey());
                        instance.toggleDebugPoints(debugPoints, DebugPointOperation.set);
                    }
                    hideOldUI(fieldIdToHide);
                });
            }
            ;
            function getInstanceFromRefField(ref) {
                return MonacoUtils.instanceMap.get(ref);
            }
            const defOptions = {
                "noImplicitAny": true,
                "strictNullChecks": true,
                "strictFunctionTypes": true,
                "strictPropertyInitialization": true,
                "strictBindCallApply": true,
                "noImplicitThis": true,
                "noImplicitReturns": true,
                "useDefineForClassFields": false,
                "alwaysStrict": true,
                "allowUnreachableCode": false,
                "allowUnusedLabels": false,
                "downlevelIteration": false,
                "noEmitHelpers": false,
                "noLib": false,
                "noStrictGenericChecks": false,
                "noUnusedLocals": false,
                "noUnusedParameters": false,
                "esModuleInterop": true,
                "preserveConstEnums": false,
                "removeComments": false,
                "skipLibCheck": false,
                "checkJs": false,
                "allowJs": true,
                "declaration": true,
                "experimentalDecorators": false,
                "emitDecoratorMetadata": false,
                "target": 0,
                "jsx": 0,
                "module": 99,
                "outDir": "./out/",
                sourceMap: true
            };
            var options = siDecl.getCompilerOptions(false);
            // TODO: move from here
            options.sourceMap = true;
            options.declaration = true;
            options.outDir = "./out/";
            //TODO: watch this. if we don't do this, we can't generate .js files from default langHost
            delete options.allowNonTsExtensions;
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
            siDecl.initializeTypeDeclarations(snMonacoConfig.appScope + '.jeffa').then(() => __awaiter(this, void 0, void 0, function* () {
                initializeEditors(false);
                const result = yield debugPointManager_1.DebugPointManager.get().loadAllDebugPoints();
                let it = MonacoUtils.instanceMap.keys();
                while (true) {
                    let itResult = it.next();
                    if (itResult.done)
                        break;
                    const fieldName = itResult.value;
                    const editor = MonacoUtils.instanceMap.get(fieldName);
                    let resp = debugPointManager_1.DebugPointManager.get().getDebugLineNumbers(editor.getDebugPointKey());
                    const instance = MonacoUtils.instanceMap.get(fieldName);
                    instance.toggleDebugPoints(resp, DebugPointOperation.set);
                }
            }));
            if (customeDecl.length > 0) {
                //TODO: because of deletion of 'allowNonTsExtensions', we need to add file name with extension
                monaco.languages.typescript.typescriptDefaults.addExtraLib(customeDecl, 'jeffa.d.ts');
            }
            const isCustomEventDefined = typeof codenowCustomEvent !== 'undefined' && typeof codenowCustomEvent.observe !== 'undefined';
            if (!isCustomEventDefined)
                return;
            //When tabs are disabled, it's possible the script editor needs to be initialized.
            codenowCustomEvent.observe('tabs.disable', () => {
                initializeEditors();
            });
            //If the editor becomes visible, but has not yet initialized, we initialize it for the first time.
            codenowCustomEvent.observe('element_script_display_true', () => {
                initializeEditors();
            });
            // Initialize the editor on tab switch.
            codenowCustomEvent.observe('tab.activated', function () {
                initializeEditors();
            });
        }
        static getTableName() {
            return MonacoUtils.snMonacoConfig.tableName;
        }
        static getSysId() {
            return MonacoUtils.snMonacoConfig.sysId;
        }
        static isNew() {
            return MonacoUtils.snMonacoConfig.sysId === '-1';
        }
        static save(field) {
            return __awaiter(this, void 0, void 0, function* () {
                const url = `/api/now/typescript_helpers/monaco_fields_update/${MonacoUtils.snMonacoConfig.tableName}/${MonacoUtils.snMonacoConfig.sysId}`;
                return codenowUtils_3.CodeNowUtils.snFetch(url, {
                    method: "POST",
                    body: JSON.stringify({ [field.name]: field })
                });
            });
        }
        static saveAll() {
            return __awaiter(this, void 0, void 0, function* () {
            });
        }
    }
    exports.MonacoUtils = MonacoUtils;
    MonacoUtils.instanceMap = new Map();
});
define("main", ["require", "exports", "monacoField", "siDeclEmittor", "codenowUtils", "monacoField", "constants", "seismic", "codenowStyle"], function (require, exports, newMonaco, siDecl, codenowUtils_4, monacoField_1, constants, seismic_2, codenowStyle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    newMonaco = __importStar(newMonaco);
    siDecl = __importStar(siDecl);
    constants = __importStar(constants);
    codenowStyle_1 = __importDefault(codenowStyle_1);
    function checkSeismicLibVersions() {
        if (!siDecl.isSeismicComponent())
            return;
        codenowUtils_4.CodeNowUtils.snFetch('./now/workspace/agent', {}, false).then((req) => {
            req.text().then((text) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                let coreScriptCount = 0;
                const scripts = [...doc.getElementsByTagName('script')].map(script => script.src).filter((src) => {
                    if (src.length === 0)
                        return false;
                    if (coreScriptCount >= 5)
                        return false;
                    coreScriptCount++;
                    return true;
                }).map(src => new URL(src).pathname);
                console.log(scripts);
                let isSame = true;
                scripts.forEach((src, index) => {
                    if (!isSame)
                        return;
                    let seismicPaths = window.recordConfig.seismicPaths;
                    if (Array.isArray(seismicPaths) && seismicPaths.length > index) {
                        let pathName = new URL(location.origin + seismicPaths[index]).pathname;
                        if (pathName !== src)
                            isSame = false;
                    }
                    else {
                        isSame = false;
                    }
                });
                if (isSame)
                    return;
                codenowUtils_4.CodeNowUtils.snFetch("./api/now/table/sys_properties/40ef6b780b1010105775aabcb4673a8f", {
                    "body": JSON.stringify({ value: scripts.join(',') }),
                    "method": "PUT",
                }, true).then((req) => {
                    console.log('seismic properties updated successfully');
                });
            });
        });
    }
    class CodeMirrorNoScriptTextAreaElement {
        constructor(name) {
            this.name = name;
            this.name = name;
        }
        initialize(name) {
            this.name = name;
        }
        setReadOnly(disabled) {
        }
        isDisabled() {
            return false;
        }
        isReadOnly() {
            return false;
        }
        getValue() {
            if (typeof currentSI !== 'undefined')
                return currentSI.script;
            let instance = monacoField_1.MonacoUtils.getMonacoInstance(this.name);
            if (instance)
                return monacoField_1.MonacoUtils.getMonacoInstance(this.name).getValue().value;
            const textEl = g_form.getElement(this.name);
            if (textEl)
                return textEl.value;
            return '';
        }
        setValue(newValue) {
            if (typeof currentSI !== 'undefined')
                newValue == currentSI.script;
            const textEl = g_form.getElement(this.name);
            if (!textEl)
                return;
            textEl.value = newValue;
            const instance = monacoField_1.MonacoUtils.getMonacoInstance(this.name);
            // if(instance && !instance.isFromEditorSave())
            // 	instance.updateModelValue(newValue);
            instance === null || instance === void 0 ? void 0 : instance.updateModelValue(newValue);
            onChange(this.name);
        }
        isVisible() {
            return true;
        }
    }
    exports.CodeMirrorNoScriptTextAreaElement = CodeMirrorNoScriptTextAreaElement;
    class Main {
        static loadMonaco() {
            return __awaiter(this, void 0, void 0, function* () {
                if (Main.monacoLoaderPromise)
                    return Main.monacoLoaderPromise;
                Main.monacoLoaderPromise = new Promise((resolve, reject) => {
                    /// @ts-ignore
                    require(['vs/editor/editor.main'], () => {
                        function checkMonaco() {
                            if (typeof monaco === 'undefined')
                                return requestAnimationFrame(checkMonaco);
                            resolve(true);
                        }
                        checkMonaco();
                    });
                });
                return Main.monacoLoaderPromise;
            });
        }
        static waitForGlideForm() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    function isFormAvailable() {
                        if (typeof g_form === 'undefined')
                            return setTimeout(isFormAvailable, 50);
                        resolve({ tableName: g_form.getTableName(), sysId: g_form.getUniqueValue(), isNewRecord: g_form.isNewRecord() });
                    }
                    isFormAvailable();
                });
            });
        }
        static init() {
            return __awaiter(this, void 0, void 0, function* () {
                const isUIThread = typeof window !== 'undefined';
                if (!isUIThread)
                    return;
                if (siDecl.isServiceNow()) {
                    checkSeismicLibVersions();
                    window.CodeMirrorNoScriptTextAreaElement = CodeMirrorNoScriptTextAreaElement;
                    if (!!window.snMonacoConfig) {
                        let result = yield Main.waitForGlideForm();
                        if (result.isNewRecord)
                            result.sysId = '-1';
                        window.snMonacoConfig.tableName = result.tableName;
                        window.snMonacoConfig.sysId = result.sysId;
                        window.snMonacoConfig.isNewRecord = result.isNewRecord;
                        const url = `/api/now/typescript_helpers/monaco_fields_config`;
                        const body = {
                            tableName: window.snMonacoConfig.tableName,
                            sysId: window.snMonacoConfig.sysId,
                            isNew: window.snMonacoConfig.isNewRecord,
                            fields: window.snMonacoConfig.codeNowFieldConfig.fieldNames
                        };
                        yield Main.loadMonaco();
                        window.snMonacoConfig.fields = yield codenowUtils_4.CodeNowUtils.snFetch(url, {
                            method: 'POST',
                            body: JSON.stringify(body)
                        });
                        // const results = await Promise.all([Main.loadMonaco(), CodeNowUtils.snFetch(url, {
                        // 	method: 'POST',
                        // 	body: JSON.stringify(body)
                        // })]);
                        // window.snMonacoConfig.fields = results[1];
                        newMonaco.MonacoUtils.initMonacoForOthers(window.snMonacoConfig);
                        return;
                    }
                }
                if (siDecl.isSeismicComponent()) {
                    const parms = new URL(document.location.href).searchParams;
                    const fiddleId = parms.get('fid');
                    window.recordConfig.uxfRecord = { sys_id: "-1", number: '', payload: {}, short_description: '' };
                    if (typeof fiddleId === 'string' && fiddleId.length > 0)
                        window.recordConfig.uxfRecord.sys_id = fiddleId;
                    let isFiddleFetched = false;
                    if (!siDecl.isNewFiddle()) {
                        const fiddleUrl = `api/now/table/ux_fiddle_play/${window.recordConfig.uxfRecord.sys_id}`;
                        try {
                            const uxfRecord = (yield codenowUtils_4.CodeNowUtils.snFetch(fiddleUrl, undefined, true)).result;
                            if (uxfRecord) {
                                Object.assign(window.recordConfig.uxfRecord, uxfRecord);
                                const payload = uxfRecord.payload;
                                if (typeof payload === 'string' && payload.length > 0)
                                    window.recordConfig.uxfRecord.payload = JSON.parse(payload);
                                isFiddleFetched = true;
                            }
                        }
                        catch (e) {
                        }
                    }
                    if (!isFiddleFetched) {
                        const lastSessionValues = { "boot.ts": { "source": "import properties from './props';\nimport initialState from './state';\nimport actions from './actions'\nimport './component';\n\ndeclare global {\n\n\texport interface ActionTypes {\n\t\tclicked: { name: string, age: number },\n\t\tselected: { selcted: boolean },\n\t\tTIMESTAMP_LOGGED: {}\n\t}\n\n\tnamespace MyComponent {\n\t\ttype Properties = ComponentPropType<typeof properties>;\n\t\ttype InitialState = typeof initialState;\n\t\ttype AggregateState = InitialState & { properties: Properties };\n\t\ttype Actions = typeof actions;\n\t\ttype ActionArgs<ActionName extends keyof ActionTypes = UNKNOWN_ACTION> = ActionHandlerArgs<Properties, AggregateState, ActionDispatcher<AggregateState, Actions, ActionName>, ActionName>;\n\t\ttype ComponentDispatcher = Dispatcher<AggregateState, Actions>;\n\t\ttype EventArgs = EventHandlerArgs<Properties, AggregateState, Actions>;\n\t\ttype InterceptorArgs<ActionName extends keyof ActionTypes> = {\n\t\t\tcoeffects: ActionArgs<ActionName>,\n\t\t\teffects: Array<ActionArgs<ActionName>>\n\t\t}\n\t}\n\tnamespace MyAnotherComponent {\n\t\ttype Properties = { one: string, two: boolean, three: number };\n\t\ttype InitialState = typeof initialState;\n\t\ttype AggregateState = InitialState & { properties: Properties };\n\t\ttype Actions = { myclicked: {}, myselected: {} };\n\t\ttype ActionArgs<ActionName extends keyof ActionTypes = UNKNOWN_ACTION> = ActionHandlerArgs<Properties, AggregateState, ActionDispatcher<AggregateState, Actions, ActionName>, ActionName>;\n\t\ttype ComponentDispatcher = Dispatcher<AggregateState, Actions>;\n\t\ttype EventArgs = EventHandlerArgs<Properties, AggregateState, Actions>;\n\t\ttype InterceptorArgs<ActionName extends keyof ActionTypes> = {\n\t\t\tcoeffects: ActionArgs<ActionName>,\n\t\t\teffects: Array<ActionArgs<ActionName>>\n\t\t}\n\t}\n\n\t/** These are just for intellisense helpers if you write code outside of 'createCustomElement'. 😜*/\n\ttype Properties = ComponentPropType<typeof properties>;\n\ttype InitialState = typeof initialState;\n\ttype AggregateState = InitialState & { properties: Properties };\n\ttype Actions = typeof actions;\n\ttype ActionArgs<ActionName extends keyof ActionTypes = UNKNOWN_ACTION> = ActionHandlerArgs<Properties, AggregateState, ActionDispatcher<AggregateState, Actions, ActionName>, ActionName>;\n\ttype ComponentDispatcher = Dispatcher<AggregateState, Actions>;\n\ttype EventArgs = EventHandlerArgs<Properties, AggregateState, Actions>;\n\ttype InterceptorArgs<ActionName extends keyof ActionTypes> = {\n\t\tcoeffects: ActionArgs<ActionName>,\n\t\teffects: Array<ActionArgs<ActionName>>\n\t}\n\t/** ************************************************************************ */\n}", "active": false }, "styles.css": { "source": ".blue-border {\n\tborder: 1px solid red;\n}\nyln {\n\tcolor: green;\n}\n.parent {\n\tmargin: 5px;\n}\n.button {\n\tmargin: 5px;\n\tbackground-color: #4CAF50; /* Green */\n\tborder: none;\n\tcolor: white;\n\tpadding: 15px 32px;\n\ttext-align: center;\n\ttext-decoration: none;\n\tdisplay: inline-block;\n\tfont-size: 16px;\n}\n.blue-btn {background-color: #008CBA;} /* Blue */\n.red-btn {background-color: #f44336;} /* Red */\n.gray-btn {background-color: #e7e7e7; color: black;} /* Gray */", "active": false }, "boot.html": { "source": "<div class=\"blue-border\">\n\t<my-sample-component></my-sample-component>\n</div>", "active": false }, "component.js": { "source": "import { createCustomElement } from \"@servicenow/ui-core\";\nimport { createElement } from \"@servicenow/ui-renderer-snabbdom\";\nimport properties from './props';\nimport { t } from \"sn-translate\";\nimport initialState from './state';\nimport styles from './styles';\nimport './awesomeButton';\nimport actions, { clickActionHandler } from './actions';\n/**\n * @param {ActionArgs<'selected'>} e\n*/\nconst selectedActionHandler = (e) => {\n\te.dispatch('clicked');\n};\ncreateCustomElement('my-sample-component', {\n\tproperties,\n\tinitialState,\n\tstyles,\n\tactions,\n\tactionHandlers: {\n\t\tclicked: clickActionHandler,\n\t\tselected: selectedActionHandler,\n\t\t'NOW_ALERT#ACTION_CLICKED': {\n\t\t\t/**\n\t\t\t * 'e' is last parameter if 'args' has params.\n\t\t\t * So automatically type injection not possible\n\t\t\t * @param {InterceptorArgs<'NOW_ALERT#ACTION_CLICKED'>} e\n\t\t\t */\n\t\t\teffect(e) {\n\t\t\t},\n\t\t\targs: [/** some custom params */],\n\t\t\tinterceptors: [(e) => {\n\n\t\t\t}, {\n\t\t\t\tafter(e) {\n\n\t\t\t\t}, before(e) {\n\n\t\t\t\t}\n\t\t\t}]\n\t\t}\n\t},\n\teventHandlers: [\n\t\t{\n\t\t\tevents: ['click', 'mousedown'],\n\t\t\teffect(e) {\n\t\t\t}\n\t\t}\n\t],\n\tview(state, dispatch) {\n\t\treturn (<div className=\"parent\">\n\t\t\t<div>\n\t\t\t\t<sn-awesome-component />\n\t\t\t</div>\n\t\t\t<div>\n\t\t\t\t<button className=\"button blue-btn\" on-click={() => {\n\t\t\t\t\tdispatch.updateProperties({ age: ++state.properties.age });\n\t\t\t\t}}>properties age - {state.properties.age}</button>\n\n\t\t\t</div>\n\t\t\t<div>\n\t\t\t\t<button className=\"button red-btn\" on-click={() => {\n\t\t\t\t\tdispatch.updateState({ age: ++state.age });\n\t\t\t\t}}> state - {state.age}</button>\n\t\t\t\t<span>{t(\"hello {0}\", \"yln\")}</span>\n\t\t\t</div>\n\t\t</div>);\n\t},\n\ttransformState(state) {\n\t\treturn { ...state };\n\t}\n});", "active": false }, "props.js": { "source": "export default {\n\tage: {\n\t\tschema: { type: 'number' },\n\t\tdefault: 45\n\t},\n\tgender: {\n\t\tdefault: 'male'\n\t},\n\tarea: {\n\t\tdefault: {\n\t\t\tpin: '',\n\t\t\tstreet: {\n\t\t\t\tline: '',\n\t\t\t\troad: ''\n\t\t\t}\n\t\t},\n\t\treflect: true\n\t},\n\tsalary: {\n\t\tcomputed() {\n\t\t\treturn 0;\n\t\t}\n\t},\n\tusers: {\n\t\tunstableParse: true\n\t},\n\tname: {\n\t\tdefault: 'Fred',\n\t\treadonly: true\n\t}\n};", "active": false }, "state.js": { "source": "export default {\n\tfirstName: 'lakshmi',\n\tlastName: 'narayana',\n\tage: 38\n};", "active": false }, "actions.js": { "source": "export default {\n\tclicked: {},\n\tselected: {}\n};\n/**\n * @param {ActionArgs<'clicked'>} e\n */\nexport const clickActionHandler = (e) => {\n\tconsole.log(e.action.type);\n}", "active": false }, "styles.ts": { "source": "export default '';", "active": false }, "awesomeButton.tsx": { "source": "import { createCustomElement } from \"@servicenow/ui-core\";\nimport { createElement } from '@servicenow/ui-renderer-snabbdom';\nimport props from './props';\nimport state from './state';\nimport styles from './styles';\n\nconst properties = { ...props };\nconst initialState = { ...state };\ncreateCustomElement('sn-awesome-component', {\n\tstyles,\n\tinitialState,\n\tproperties,\n\tview(state) {\n\t\treturn (<div>\n\t\t\t<button className=\"button\">{state.properties.name}</button>\n\t\t\t<button className=\"button red-btn\">{state.age}</button>\n\t\t</div>);\n\t}\n});", "active": true } };
                        const storedPayload = localStorage.getItem(constants.CODENOW_SEISMIC_FS_KEY);
                        if (typeof storedPayload === 'string' && storedPayload.length > 0) {
                            try {
                                Object.assign(lastSessionValues, JSON.parse(storedPayload));
                            }
                            catch (e) {
                            }
                            finally {
                                window.recordConfig.uxfRecord.payload = lastSessionValues;
                            }
                        }
                        else
                            window.recordConfig.uxfRecord.payload = lastSessionValues;
                    }
                    let sessionValues = window.recordConfig.uxfRecord.payload;
                    const keys = Object.keys(sessionValues);
                    for (const key of keys) {
                        const isValid = key.search(/\.((ts|js)x?|css|html|scss|json)$/) > 0;
                        if (!isValid || Object.keys(sessionValues[key]).length === 0) {
                            delete sessionValues[key];
                            continue;
                        }
                        if (typeof sessionValues[key].source !== 'string' || sessionValues[key].source.length === 0) {
                            if (key.search(/\.(ts|js)?x$/))
                                sessionValues[key].source = seismic_2.seismicObj.sample;
                            else if (key.search(/\.css$/))
                                sessionValues[key].source = constants.SAMPLE_CSS;
                            else
                                sessionValues[key].source = constants.SAMPLE_HTML;
                            sessionValues[key].source = '';
                        }
                    }
                }
                if (!window.recordConfig.isFromScriptRunner) {
                    const keyName = 'codenow_' + window.recordConfig.sysId;
                    const lastActiveTime = parseInt(localStorage.getItem(keyName));
                    if (!isNaN(lastActiveTime)) {
                        if ((Date.now() - lastActiveTime) < 4000) {
                            if (confirm('Seems like you already opened this SI, click OK to close')) {
                                window.close();
                            }
                        }
                    }
                    let isRemoved = false;
                    function updateSIActiveTime() {
                        if (isRemoved)
                            return;
                        localStorage.setItem(keyName, Date.now() + '');
                        setTimeout(updateSIActiveTime, 1000);
                    }
                    updateSIActiveTime();
                    window.addEventListener('beforeunload', () => {
                        isRemoved = true;
                        localStorage.removeItem(keyName);
                    });
                }
                Main.loadEditorUI();
            });
        }
        static escapeText(text) {
            // http://www.javascriptkit.com/jsref/escapesequence.shtml
            // \b	Backspace.
            // \f	Form feed.
            // \n	Newline.
            // \O	Nul character.
            // \r	Carriage return.
            // \t	Horizontal tab.
            // \v	Vertical tab.
            // \'	Single quote or apostrophe.
            // \"	Double quote.
            // \\	Backslash.
            // \ddd	The Latin-1 character specified by the three octal digits between 0 and 377. ie, copyright symbol is \251.
            // \xdd	The Latin-1 character specified by the two hexadecimal digits dd between 00 and FF.  ie, copyright symbol is \xA9.
            // \udddd	The Unicode character specified by the four hexadecimal digits dddd. ie, copyright symbol is \u00A9.
            var _backspace = '\b'.charCodeAt(0);
            var _formFeed = '\f'.charCodeAt(0);
            var _newLine = '\n'.charCodeAt(0);
            var _nullChar = 0;
            var _carriageReturn = '\r'.charCodeAt(0);
            var _tab = '\t'.charCodeAt(0);
            var _verticalTab = '\v'.charCodeAt(0);
            var _backslash = '\\'.charCodeAt(0);
            var _doubleQuote = '"'.charCodeAt(0);
            var _backTick = '`'.charCodeAt(0);
            var startPos = 0, chrCode, replaceWith = null, resultPieces = [];
            for (var i = 0, len = text.length; i < len; i++) {
                chrCode = text.charCodeAt(i);
                switch (chrCode) {
                    case _backTick:
                        replaceWith = '\\`';
                        break;
                    case _backspace:
                        replaceWith = '\\b';
                        break;
                    case _formFeed:
                        replaceWith = '\\f';
                        break;
                    case _newLine:
                        replaceWith = '\\n';
                        break;
                    case _nullChar:
                        replaceWith = '\\0';
                        break;
                    case _carriageReturn:
                        replaceWith = '\\r';
                        break;
                    case _tab:
                        replaceWith = '\\t';
                        break;
                    case _verticalTab:
                        replaceWith = '\\v';
                        break;
                    case _backslash:
                        replaceWith = '\\\\';
                        break;
                    case _doubleQuote:
                        replaceWith = '\\"';
                        break;
                }
                if (replaceWith !== null) {
                    resultPieces.push(text.substring(startPos, i));
                    resultPieces.push(replaceWith);
                    startPos = i + 1;
                    replaceWith = null;
                }
            }
            resultPieces.push(text.substring(startPos, len));
            return resultPieces.join('');
        }
        static getWorkerUrl(appVersion) {
            if (window.navigator.userAgent.toLowerCase().indexOf('chrome') >= 0) {
                //FIXME: chrome works fine with below logic but firefox failing
                let workerName = "ylnworker.jsdbx";
                if (!window.g_ck)
                    workerName = './ylnworker.js';
                return workerName + '?v=' + appVersion;
            }
            let appJS = location.origin + '/';
            if (window.recordConfig.paths.app.startsWith('ylnEditorMain'))
                appJS += window.recordConfig.paths.app;
            else
                appJS = window.recordConfig.paths.app;
            if (!window.g_ck)
                appJS = location.origin + '/app.js';
            const linterPath = "'" + window.recordConfig.paths.linter + "'";
            const loaderPath = "'" + window.recordConfig.paths.vsLoader + "'";
            const tsCompilerPath = "'" + window.recordConfig.paths.tsCompiler + "'";
            const scripts = [linterPath, loaderPath, tsCompilerPath].join(',');
            const tempConfig = {
                libVersions: {
                    appVersion: window.recordConfig.libVersions.appVersion
                },
                paths: {
                    app: window.recordConfig.paths.app,
                    tsCompiler: window.recordConfig.paths.tsCompiler,
                    vsLoader: window.recordConfig.paths.vsLoader,
                    linter: window.recordConfig.paths.linter
                },
                isES6: window.recordConfig.isES6
            };
            let str = "self.recordConfig = JSON.parse('" + JSON.stringify(tempConfig) + "');\n";
            str += "importScripts(" + scripts + ");";
            str += "require.config({baseUrl: './',urlArgs: 'sysparm_substitute=false', paths: {},ignoreDuplicateModules: []});";
            str += "define('typescript', [], function () {return self.ts;});";
            str += "importScripts('" + appJS + "');";
            str += "var siDeclName = './siDeclEmittor';require(siDeclName).onThreadInitialized(self);";
            return "data:text/javascript;charset=utf-8," + encodeURIComponent(str);
        }
        static createParserThread(siDecl) {
            const tempConfig = {
                libVersions: {
                    appVersion: window.recordConfig.libVersions.appVersion
                },
                paths: {
                    app: window.recordConfig.paths.app,
                    tsCompiler: window.recordConfig.paths.tsCompiler,
                    vsLoader: window.recordConfig.paths.vsLoader,
                    linter: window.recordConfig.paths.linter
                },
                isES6: window.recordConfig.isES6
            };
            window.ylnWorker = new Worker(Main.getWorkerUrl(window.recordConfig.libVersions.appVersion + ''), { name: 'ylnworker?codenowWorkerParams=' + JSON.stringify(tempConfig) });
            siDecl.onThreadInitialized(window.ylnWorker);
        }
        static cacheWindowObject() {
            if (typeof window.g_ck === 'undefined')
                return;
            if (typeof g_form !== 'undefined')
                g_form.ylnWindow = window;
            setTimeout(Main.cacheWindowObject, 1000);
        }
        static loadEditorUI() {
            return __awaiter(this, void 0, void 0, function* () {
                function onVisibilityChange() {
                    window.removeEventListener('visibilitychange', onVisibilityChange);
                    settings.initialize();
                }
                const isDebugVersion = window.recordConfig.paths.app.indexOf('codenow.debug.js') >= 0;
                if (isDebugVersion) {
                    const codenowStyle = document.createElement('link');
                    codenowStyle.rel = 'stylesheet';
                    codenowStyle.href = 'http://yln:9090//styles/ts_editor/myEditor.css';
                    document.head.appendChild(codenowStyle);
                }
                else {
                    const codenowStyle = document.createElement('style');
                    codenowStyle.type = 'text/css';
                    codenowStyle.appendChild(document.createTextNode(codenowStyle_1.default));
                    document.head.appendChild(codenowStyle);
                }
                yield Main.loadMonaco();
                /// @ts-ignore
                require(['vs/language/typescript/tsWorker'], () => {
                    define("typescript", ["require"], () => {
                        return window.ts;
                    });
                    Main.cacheWindowObject();
                    if (siDecl.canWriteSI()) {
                        if (!siDecl.isSeismicComponent())
                            Main.createParserThread(siDecl);
                    }
                    if (typeof document.hidden !== 'undefined') {
                        if (document.hidden)
                            window.addEventListener('visibilitychange', onVisibilityChange);
                        else
                            settings.initialize();
                    }
                    else {
                        settings.initialize();
                    }
                });
            });
        }
    }
    exports.Main = Main;
});
define("monacoInit", ["require", "exports", "constants", "fileSearch", "siDeclEmittor", "siParser", "tsCompilerOptions", "codenowUtils", "debugPointManager", "seismic", "amdBundler"], function (require, exports, editorConstants, fileSearch_1, siDeclEmittor, siParser, tsCompilerOptions_2, codenowUtils_5, debugPointManager_2, seismic_3, amdBundler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    editorConstants = __importStar(editorConstants);
    siDeclEmittor = __importStar(siDeclEmittor);
    siParser = __importStar(siParser);
    tsCompilerOptions_2 = __importDefault(tsCompilerOptions_2);
    amdBundler_1 = __importDefault(amdBundler_1);
    var TranspilerOutput = siDeclEmittor.TranspilerOutput;
    function initMainEditor() {
        function convertMS(milliseconds) {
            let day = 0, hour = 0, minute = 0, seconds = 0, ms = 0;
            ms = Math.round(milliseconds % 1000);
            seconds = Math.floor(milliseconds / 1000);
            minute = Math.floor(seconds / 60);
            seconds = seconds % 60;
            hour = Math.floor(minute / 60);
            minute = minute % 60;
            day = Math.floor(hour / 24);
            hour = hour % 24;
            return { day, hour, minute, seconds, ms };
        }
        // if (siDeclEmittor.isScriptRunner() || siDeclEmittor.isSeismicComponent())
        // 	document.body.style.width  = '200%';
        var dirtyCount = 0;
        var isFullScreenMode = false;
        const SI_TABLE_NAME = 'sys_script_include';
        const SI_SCRIPT_FIELD = 'script';
        const CODENOW_FS_KEY = siDeclEmittor.isSeismicComponent() ? editorConstants.CODENOW_SEISMIC_FS_KEY : editorConstants.CODENOW_SCRIPT_RUNNER_FS_KEY;
        window.addEventListener("beforeunload", function (ev) {
            if (dirtyCount > 0 && (isScriptRunner() || (typeof g_form != 'undefined' && !g_form.submitted))) {
                if (isScriptRunner()) {
                    const instance = window['tsInstance'];
                    if (instance)
                        instance.saveToLocalStorage();
                }
                ev.returnValue = 'There is a pending work. sure you want to leave';
            }
        });
        const INVALID_GO_TO_DEF_LINE = -1;
        const INVALID_TIMER_ID = -1;
        const AUTO_COMPILATION_TIME = 5 * 1000;
        const RESISZE_OBSERVER_TIME = 2 * 1000;
        const SI_TEMP_DEBUGGER_SYS_ID = '1172f0210bf213008e64aabcb4673aee';
        const SI_TEMP_DEBUGGET_NAME = 'CodeNowTempDebugger';
        const isScriptRunner = siDeclEmittor.isScriptRunner;
        var monacoInstance;
        var compilerOptions = tsCompilerOptions_2.default;
        let defaultTheme = 'vs';
        function getFileNameFromUri(uri) {
            return uri.path.replace('/', '');
        }
        jQuery(function () {
            function getContent() {
                let jsxTarget = [ts.JsxEmit.None, ts.JsxEmit.Preserve, ts.JsxEmit.React, ts.JsxEmit.ReactNative];
                let scriptTargets = [ts.ScriptTarget.ES3, ts.ScriptTarget.ES5,
                    ts.ScriptTarget.ES2015, ts.ScriptTarget.ES2016,
                    ts.ScriptTarget.ES2018, ts.ScriptTarget.Latest];
                let scriptTargetStr = `<select onchange="settings.onTargetChange('target', this.value)">`;
                let currentTarget = compilerOptions.target;
                for (let i = 0; i < scriptTargets.length; i++) {
                    let selected = '';
                    if (currentTarget == scriptTargets[i])
                        selected = 'selected';
                    scriptTargetStr += `<option ${selected} value='${scriptTargets[i]}'>${ts.ScriptTarget[scriptTargets[i]]}</option>`;
                }
                scriptTargetStr += '</select>';
                const moduleTargets = [ts.ModuleKind.None, ts.ModuleKind.CommonJS, ts.ModuleKind.AMD,
                    ts.ModuleKind.UMD, ts.ModuleKind.System, ts.ModuleKind.ES2015, ts.ModuleKind.ESNext];
                let moduleTargetStr = `<select onchange="settings.onModuleChange('module', this.value)">`;
                moduleTargets.forEach((val) => {
                    let selected = '';
                    if (val === compilerOptions.module)
                        selected = 'selected';
                    moduleTargetStr += `<option ${selected} value='${val}'>${ts.ModuleKind[val]}</option>`;
                });
                moduleTargetStr += `</select>`;
                let jsxTargetContent = `<select onchange="settings.onJSXChange('jsxTarget', this.value)">`;
                jsxTarget.forEach((item, index, ar) => {
                    let selcted = '';
                    let currentTarget = compilerOptions.jsx;
                    if (index === currentTarget)
                        selcted = 'selected';
                    jsxTargetContent += `<option ${selcted} value='${item}'>${ts.JsxEmit[item]}</option>`;
                });
                jsxTargetContent += `</select>`;
                if (!isScriptRunner())
                    jsxTargetContent = '';
                let jsxFactoryContent = `<select onchange="settings.onJSXFactoryChange('jsxFactory', this.value)">`;
                editorConstants.jsxFactoryTypes.forEach((item, index, ar) => {
                    let selcted = '';
                    if (compilerOptions.jsxFactory === item)
                        selcted = 'selected';
                    let [namespace, displayValue] = item.split('.');
                    if (!displayValue)
                        displayValue = namespace;
                    jsxFactoryContent += `<option ${selcted} value='${item}'>${displayValue}</option>`;
                });
                jsxFactoryContent += `</select>`;
                if (!isScriptRunner())
                    jsxFactoryContent = '';
                const clsCheck = "glyphicon-check";
                const clsUnCheck = "glyphicon-unchecked";
                let bodyContent = `<div style="max-height: 300px;overflow: auto; white-space: nowrap;">
				<div class="eslint">
					<label style="margin: 8px;">
						<input onclick="javascript:settings.toggleLinter();" style="margin: 0px 8px;" type='checkbox' ${tsCompilerOptions_2.default.linter ? 'checked' : ''}>
						Enable ESlint
					</label>
				</div>
				<ul class="list-group checked-list-box" onclick="javascript:settings.onCompilerSettingsChange(event.target)">
					<li class="list-group-item">Target ${scriptTargetStr}</li>
					<li class="list-group-item">Module ${moduleTargetStr}</li>
					<li class="list-group-item">JSX ${jsxTargetContent}</li>
					<li class="list-group-item">JSX Factory ${jsxFactoryContent}</li>
					<li class="list-group-item" title="Allows js to compile" data-key="allowJs">
						<span class='state-icon glyphicon ${compilerOptions.allowJs ? clsCheck : clsUnCheck}'></span>
						allowJs
					</li>
					<li class="list-group-item" title="Enable type checking on JavaScript files" data-key="checkJs">
						<span class='state-icon glyphicon ${compilerOptions.checkJs ? clsCheck : clsUnCheck}'></span>
						checkJs
					</li>
					<li class="list-group-item" title = "Warn on expressions and declarations with an implied 'any' type" data-key="noImplicitAny">
						<span class='state-icon glyphicon ${compilerOptions.noImplicitAny ? clsCheck : clsUnCheck}'></span>
						noImplicitAny
					</li>
					<li class="list-group-item" title="Enable strict null checks" data-key="strictNullChecks">
						<span class='state-icon glyphicon ${compilerOptions.strictNullChecks ? clsCheck : clsUnCheck}'></span>
						strictNullChecks
					</li>
					<li class="list-group-item" title="Raise error on 'this' expressions with an implied any type" data-key="noImplicitThis">
						<span class='state-icon glyphicon ${compilerOptions.noImplicitThis ? clsCheck : clsUnCheck}'></span>
						noImplictThis
					</li>
					<li class="list-group-item" title="Report error when not all code paths in function return a value" data-key="noImplicitReturns">
						<span class='state-icon glyphicon ${compilerOptions.noImplicitReturns ? clsCheck : clsUnCheck}'></span>
						noImplicitReturns
					</li>
					<li class="list-group-item" title="Do not report errors on unreachable code" data-key="allowUnreachableCode">
						<span class='state-icon glyphicon ${compilerOptions.noImplicitReturns ? clsCheck : clsUnCheck}'></span>
						allowUnreachableCode
					</li>
					<li class="list-group-item" title="Report errors for fallthrough cases in switch statement" data-key="noFallthroughCasesInSwitch">
						<span class='state-icon glyphicon ${compilerOptions.noImplicitReturns ? clsCheck : clsUnCheck}'></span>
						noFallthroughCasesInSwitch
					</li>
					<li class="list-group-item" title="Enable all strict type-checking options" data-key="strict">
						<span class='state-icon glyphicon ${compilerOptions.strict ? clsCheck : clsUnCheck}'></span>
						strict
					</li>
					<li class="list-group-item" title="Parse in strict mode and emit 'use strict'" data-key="alwaysStrict">
						<span class='state-icon glyphicon ${compilerOptions.alwaysStrict ? clsCheck : clsUnCheck}'></span>
						alwaysStrict
					</li>
					<li class="list-group-item" title="Do not generate custom helper functions like __extends in compiled output.'" data-key="noEmitHelpers">
						<span class='state-icon glyphicon ${compilerOptions.noEmitHelpers ? clsCheck : clsUnCheck}'></span>
						noEmitHelpers
					</li>
					<li class="list-group-item" title="Report errors on unused parameters" data-key="noUnusedParameters">
						<span class='state-icon glyphicon ${compilerOptions.noUnusedParameters ? clsCheck : clsUnCheck}'></span>
						noUnusedParameters
					</li>
					<li class="list-group-item" title="Report errors on unused locals" data-key="noUnusedLocals">
						<span class='state-icon glyphicon ${compilerOptions.noUnusedLocals ? clsCheck : clsUnCheck}'></span>
						noUnusedLocals
					</li>
					<li class="list-group-item" title="strip @internal methods when generating declaration" data-key="stripInternal">
						<span class='state-icon glyphicon ${compilerOptions["stripInternal"] ? clsCheck : clsUnCheck}'></span>
						stripInternals
					</li>
				</ul>
			</div>`;
                return bodyContent;
            }
            jQuery('#compiler-settings')["popover"]({
                html: true,
                trigger: 'manual',
                //container: 'body',
                content: function () {
                    return getContent();
                },
                title: "Compiler Settings"
            }).click(function (e) {
                if (jQuery('#compiler-settings-container > .popover').length == 0)
                    jQuery(this)['popover']('show');
                else
                    jQuery(this)['popover']('hide');
                e.stopPropagation();
                e.preventDefault();
            });
            jQuery(document).on('click', function (e) {
                var $target = jQuery(e.target);
                if ($target.data && typeof $target.data('original-title') == 'undefined' &&
                    !jQuery(e.target).parents().is('.popover.in')) {
                    jQuery('[data-original-title]')['popover']('hide');
                }
            });
        });
        function showMyTypeInfo(model, pos) {
            monaco.languages.typescript.getTypeScriptWorker().then((worker) => {
                worker(model.uri).then((client) => {
                    window['client'] = client;
                    /// @ts-ignore
                    client.getQuickInfoAtPosition(model.uri.toString(), model.getOffsetAt(pos)).then((val) => {
                        console.log('get data = ' + JSON.stringify(val));
                    });
                });
            });
        }
        function generateOutput(jsDoc = false) {
            let currentSI = siDeclEmittor.getCurrentSI();
            if (!isScriptRunner()) {
                let apiName = g_form.getValue('api_name');
                if (apiName.length == 0)
                    return Promise.reject("API Name shouldn't be empty");
                let sysId = g_form.getUniqueValue();
                let access = g_form.getValue("access");
                if (!currentSI.isNew()) {
                    currentSI.updateAPIName(apiName);
                    currentSI.updateSysId(sysId);
                    currentSI.updateAccessType(access);
                }
            }
            function updateLinterErrors(errors) {
                var monacoMarkers = errors.map((err) => {
                    return {
                        startLineNumber: err.line,
                        endLineNumber: err.endLine || err.line,
                        startColumn: err.column,
                        endColumn: err.endColumn || err.column,
                        message: `${err.message} (${err.ruleId})`,
                        severity: monaco.MarkerSeverity.Warning,
                        source: 'ESLint',
                    };
                });
                monaco.editor.setModelMarkers(this.model, 'eslint', monacoMarkers);
            }
            const existingAPI = currentSI.api_name;
            const promise = new Promise((resolve, reject) => {
                let startTime = Date.now();
                if (currentSI.isJavascript()) {
                    let options = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
                    siDeclEmittor.generateTypeDeclForSingleRecord(options).then((result) => {
                        console.log('compilation time is ' + (Date.now() - startTime));
                        // At present, we are not supporting any typeof ES6 features in 'sys_script_include'.
                        // so replace the original js content
                        if (!isScriptRunner()) {
                            if (!siDeclEmittor.isTranspiledScript())
                                result.js = currentSI.tsscript;
                        }
                        else {
                            if (currentSI.api_name !== existingAPI) {
                                requestAnimationFrame(() => {
                                    (monacoInstance).dispatchCompilation();
                                });
                            }
                        }
                        currentSI.setDirtyState(false);
                        currentSI.updateScript(result.js);
                        let output = new TranspilerOutput(result.js, '', result.sourceMap, currentSI.tsscript, undefined, result.linterErrors);
                        let backEndDecl = JSON.parse(result.declaration);
                        if (siParser.SITSFormat.isES6(backEndDecl.f)) {
                            let backEndDeclTS = currentSI.emitTSDeclaration(result.tsDeclaration, backEndDecl.f);
                            backEndDeclTS.td = backEndDecl.td;
                            backEndDecl = backEndDeclTS;
                        }
                        output.backEndDecl = Object.assign({ sc: currentSI.getScopeAndAPIMap().scope }, backEndDecl);
                        let siDeclFormat = siParser.SITSFormat.expandMinifiedFormat(backEndDecl, currentSI.getScopeAndAPIMap().scope, siParser.SITSFormat.isES6(backEndDecl.f));
                        siDeclEmittor.updateCurrentSIDeclaration(true, siDeclFormat);
                        output.declaration = JSON.stringify(siDeclFormat);
                        resolve(output);
                    }, (result) => {
                        reject(result);
                    });
                    return;
                }
                let options = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
                siDeclEmittor.generateTypeDeclForSingleRecord(options).then((result) => {
                    console.log('compilation time is ' + (Date.now() - startTime));
                    currentSI.setDirtyState(false);
                    currentSI.updateScript(result.js);
                    let output = new TranspilerOutput(result.js, '', result.sourceMap, currentSI.tsscript);
                    let backEndDecl = currentSI.emitTSDeclaration(result.declaration);
                    output.backEndDecl = Object.assign({ sc: currentSI.getScopeAndAPIMap().scope }, backEndDecl);
                    let siFormat = siParser.SITSFormat.expandMinifiedFormat(backEndDecl, currentSI.getScopeAndAPIMap().scope, currentSI.isTypescript());
                    output.declaration = JSON.stringify(siFormat);
                    siDeclEmittor.updateCurrentSIDeclaration(true, siFormat);
                    resolve(output);
                    if (currentSI.api_name !== existingAPI) {
                        requestAnimationFrame(() => {
                            (monacoInstance).dispatchCompilation();
                        });
                    }
                }, (result) => {
                    reject(result);
                });
            });
            return promise;
        }
        var isFormSubmitted = false;
        function updateTypedeclarations(withJSDoc = false, updateServer = false, saveAction = false, successCallback, failCallback) {
            var apiName = "global.Point";
            var sysId = "yln";
            var access = "public";
            let currentSI = siDeclEmittor.getCurrentSI();
            var scriptType = currentSI.script_type;
            var fieldNames = [];
            var isForm = typeof (g_form) != 'undefined';
            if (isForm) {
                fieldNames = g_form.getEditableFields();
                if (isFormSubmitted)
                    return true;
                apiName = g_form.getValue('api_name');
                sysId = g_form.getUniqueValue();
                access = g_form.getValue("access");
                if (fieldNames.indexOf('script_type') != -1)
                    scriptType = g_form.getValue('script_type');
                if (fieldNames.indexOf('jsdoc') != -1)
                    withJSDoc = g_form.getValue('jsdoc') == 'true';
            }
            currentSI.updateAPIName(apiName);
            currentSI.updateSysId(sysId);
            currentSI.updateAccessType(access);
            currentSI.updateLangType(scriptType);
            currentSI.updateJSDoc(withJSDoc);
            generateOutput(withJSDoc).then(function (result) {
                return __awaiter(this, void 0, void 0, function* () {
                    currentSI.setDirtyState(false);
                    currentSI.updateScript(result.js);
                    currentSI.updateDeclaration(result.declaration);
                    currentSI.updateSourcemap(result.sourceMap);
                    const jsScript = siParser.ClientSIRecordData.getClassConstructorFormat(siDeclEmittor.getCurrentSI());
                    currentSI.updateScript(jsScript);
                    if (isForm) {
                        g_form.setValue(editorConstants.FIELD_SCRIPT, jsScript);
                        g_form.setValue(editorConstants.FIELD_TS_SCRIPT, currentSI.tsscript);
                        g_form.setValue(editorConstants.FIELD_SOURCEMAP, currentSI.typesourcemap);
                        g_form.setValue(editorConstants.FIELD_DECLARATION, currentSI.typedeclaration);
                        if (fieldNames.indexOf(editorConstants.FIELD_DECLARATION) != -1 || saveAction)
                            isFormSubmitted = true;
                        if (!saveAction || fieldNames.indexOf(editorConstants.FIELD_TS_SCRIPT) != -1)
                            siDeclEmittor.updateSIDeclListeners(JSON.parse(result.declaration));
                    }
                    var actionName = g_form.getActionName();
                    if (updateServer && isForm && fieldNames.indexOf(editorConstants.FIELD_DECLARATION) == -1) {
                        //siDeclEmittor.updateCurrentSIDeclaration(withJSDoc);
                        let actionResult = yield codenowUtils_5.CodeNowUtils.doAction({ cmd: 'update_declaration', decl: result.backEndDecl });
                        if (codenowUtils_5.CodeNowUtils.isSuccessful(actionResult)) {
                            if (successCallback)
                                successCallback();
                        }
                        else {
                            if (failCallback)
                                failCallback();
                        }
                        return false;
                    }
                    if (saveAction) {
                        let recordConfig = window.recordConfig;
                        if (recordConfig.isNewRecord)
                            gsftSubmit(undefined, undefined, "sysverb_insert");
                        else
                            gsftSubmit(undefined, undefined, actionName);
                    }
                });
            }, function (reason) {
                g_form.addErrorMessage(reason, 'script_error');
            });
            return false;
        }
        function getDefaultTemplateCode(placeHolder = '') {
            if (siDeclEmittor.isSeismicComponent())
                return seismic_3.seismicObj.sample;
            const emojis = editorConstants.emojis;
            const emoji = emojis[Math.round(Math.random() * (emojis.length - 1))];
            return `// Avoid writing code here ${emoji}
(function() {

	// Write your code here 😎
	gs.info('Hi, ${placeHolder}');




})();
// Avoid writing code here ${emoji}`;
        }
        class MonacoEditor {
            constructor(domElement, languageType, script = "", id = "", isReadonly = false) {
                this.isReadonly = isReadonly;
                if (typeof id !== 'string' || id.length === 0)
                    id = '/' + siDeclEmittor.getCurrentModuleName();
                //this.gotoDefLine = INVALID_GO_TO_DEF_LINE;
                const currentSI = siDeclEmittor.getCurrentSI();
                window['currentSI'] = currentSI;
                if (!script) {
                    script = getDefaultTemplateCode("Welcome to ServiceNow Developement IDE! 🙏");
                    if (!isScriptRunner() && !siDeclEmittor.isSeismicComponent()) {
                        if (siDeclEmittor.isTranspiledScript())
                            script = currentSI.isTypescript() ? editorConstants.SAMPLE_TS_CONTENT : editorConstants.SAMPLE_JS_CONTENT;
                        else
                            script = editorConstants.SAMPLE_STANDARD_SI_CONTENT;
                    }
                }
                if (currentSI.tsscript.length == 0 && isScriptRunner() && !isReadonly)
                    currentSI.updateTSScript(script);
                //if (typeof Array.prototype['include'] == 'function')
                Array.prototype['include'] = undefined;
                this.model = monaco.editor.createModel(script, languageType, monaco.Uri.file(id));
                this.model.updateOptions({
                    indentSize: 4,
                    trimAutoWhitespace: true,
                    tabSize: 4,
                    insertSpaces: false,
                });
                const isNewRecord = siDeclEmittor.getCurrentSI().isNew();
                const { StaticServices } = require('vs/editor/standalone/browser/standaloneServices');
                const codeEditorService = StaticServices.codeEditorService.get();
                // const simpleServices = require('vs/editor/standalone/browser/simpleServices');
                // const SimpleEditorModelResolverService = simpleServices.SimpleEditorModelResolverService;
                // SimpleEditorModelResolverService.prototype.findModel = function (editor: monaco.editor.ICodeEditor, resource: monaco.Uri) {
                // 	const models = monaco.editor.getModels();
                // 	let finalModel: monaco.editor.ITextModel;
                // 	return monaco.editor.getModels().find(model => model.uri.toString() === resource.toString());
                // };
                this.editor = monaco.editor.create(domElement, {
                    model: this.model,
                    language: languageType,
                    renderWhitespace: !isReadonly ? "all" : "none",
                    fontSize: 14,
                    formatOnType: true,
                    formatOnPaste: true,
                    glyphMargin: !isNewRecord || window.recordConfig.breakpoints,
                    readOnly: isReadonly,
                    renderIndentGuides: true,
                    lineNumbersMinChars: 2,
                    suggestSelection: "recentlyUsed",
                    scrollBeyondLastLine: true,
                    lightbulb: {
                        enabled: true
                    },
                    minimap: {
                        enabled: false
                    },
                    scrollbar: {
                        useShadows: false,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                        vertical: 'hidden',
                        horizontal: 'hidden',
                        verticalScrollbarSize: 7,
                        horizontalScrollbarSize: 7,
                        arrowSize: 30,
                    }
                }, {
                    modelService: {
                        findModel(editor, resource) {
                            const models = monaco.editor.getModels();
                            let finalModel;
                            return monaco.editor.getModels().find(model => model.uri.toString() === resource.toString());
                        }
                    },
                    editorService: Object.assign(codeEditorService, {
                        openCodeEditor(obj, editor) {
                            return __awaiter(this, void 0, void 0, function* () {
                                const { resource, options } = obj;
                                //debugger;
                                // //if(editor.getModel().uri.authority.toLocaleLowerCase() == resource.authority)
                                // //    return null;
                                // var thisURI = editor.getModel().uri;
                                // var thisPath = thisURI.path;
                                //debugger;
                                // console.log(JSON.stringify(resource));
                                // var currentModel = modelMap[resource.authority.toLocaleLowerCase()];
                                const models = monaco.editor.getModels();
                                let finalModel;
                                if (siDeclEmittor.isSeismicComponent()) {
                                    const fileName = getFileNameFromUri(resource);
                                    const [name] = fileName.split('.');
                                    const cssUri = monaco.Uri.file(name + '.css');
                                    if (fileName.endsWith('.ts')) {
                                        const cssModel = models.find((model) => {
                                            return model.uri.toString() === cssUri.toString();
                                        });
                                        finalModel = cssModel;
                                    }
                                }
                                const currentModel = finalModel || models.find((m) => {
                                    //return m.uri.authority.toLocaleLowerCase() == resource.authority;
                                    //return m.uri.path == resource.path;
                                    return m.uri.toString() == resource.toString();
                                });
                                if (currentModel) {
                                    editor.setModel(currentModel);
                                    if (options.selection) {
                                        const pos = { lineNumber: options.selection.startLineNumber, column: options.selection.startColumn };
                                        //editor.setPosition(pos);
                                        //editor.revealPositionInCenter(pos);
                                        editor.setSelection(options.selection);
                                        editor.revealRangeInCenter(options.selection, 1);
                                    }
                                }
                                //console.log('model found');
                                return {
                                    getControl: () => editor,
                                    getModel: () => currentModel,
                                    deltaDecorations: (...args) => []
                                };
                            });
                        }
                    }),
                    textModelService: {
                        createModelReference(uri) {
                            const fileName = getFileNameFromUri(uri);
                            const [name] = fileName.split('.');
                            const cssUri = monaco.Uri.file(name + '.css');
                            // const cssModel = monaco.editor.getModels().find( (m) => {
                            // 	return m.uri.toString() === cssUri.toString();
                            // });
                            const textEditorModel = {
                                load() {
                                    return Promise.resolve(textEditorModel);
                                },
                                dispose() { },
                                textEditorModel: monaco.editor.getModel(cssUri) || monaco.editor.getModel(uri)
                            };
                            return Promise.resolve({
                                object: textEditorModel,
                                dispose() { }
                            });
                        },
                        registerTextModelContentProvider: () => ({
                            dispose: () => {
                                console.log("registerTextModelContentProvider called");
                            }
                        })
                    },
                    openerService: siDeclEmittor.gotoDefintionService
                });
                // monaco.languages.registerDefinitionProvider('typescript', {
                // 	provideDefinition(model, position, token) {
                // 		return Promise.resolve(null);
                // 	}
                // });
                // monaco.languages.registerReferenceProvider('typescript', {
                // 	provideReferences(model, position, context, token) {
                // 		debugger;
                // 		return Promise.resolve(null);
                // 	}
                // });
                function resizeEditor() {
                    if (!siDeclEmittor.isScriptRunner())
                        return;
                    var height = jQuery("#yln-standalone-editor > .navbar-default").height();
                    jQuery("#yln-standalone-editor > .workspace-area").css({ top: height });
                }
                let resizeTimerId = INVALID_TIMER_ID;
                function onLayoutChange() {
                    resizeTimerId = INVALID_TIMER_ID;
                    if (this.editor)
                        this.editor.layout();
                    resizeEditor();
                }
                window.addEventListener("resize", () => {
                    if (resizeTimerId != INVALID_TIMER_ID)
                        window.clearTimeout(resizeTimerId);
                    resizeTimerId = window.setTimeout(onLayoutChange.bind(this), RESISZE_OBSERVER_TIME);
                });
                resizeEditor();
            }
            getLanguageServiceOutput() {
                return __awaiter(this, void 0, void 0, function* () {
                    const currentModel = this.editor.getModel();
                    const uriStr = currentModel.uri.toString();
                    const worker = yield monaco.languages.typescript.getTypeScriptWorker();
                    const client = yield worker(currentModel.uri);
                    const output = yield client.getEmitOutput(uriStr);
                    if (!output.emitSkipped)
                        return Promise.resolve(output);
                    const diagnosticsErrors = yield client.getSyntacticDiagnostics(uriStr);
                    const syntacticDiagnostics = yield client.getSemanticDiagnostics(uriStr);
                    return Promise.reject({ diagnosticsErrors, syntacticDiagnostics });
                });
            }
            onContentChanged(e) { }
            ;
            updateModelContent(newContent) {
                this.editor.getModel().setValue(newContent);
            }
            modifyDebugPoints() {
                return __awaiter(this, void 0, void 0, function* () { });
            }
        }
        class MonacoJSEditor extends MonacoEditor {
            constructor(domElement, script, isReadonly = false) {
                super(domElement, editorConstants.LangType.javascript, script, editorConstants.READONLY_OUTPUT_FILE_NAME, isReadonly);
                this.existingDebugPointIds = [];
            }
            updateDebugPoints(debugPoints) {
                const newDebugDecors = debugPoints.map((line) => {
                    return {
                        range: new monaco.Range(line, 1, line, 1),
                        options: {
                            glyphMarginClassName: "dbg-breakpoint",
                            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                        }
                    };
                });
                this.existingDebugPointIds = this.editor.deltaDecorations(this.existingDebugPointIds, newDebugDecors);
            }
        }
        class MonacoTSEditor extends MonacoEditor {
            constructor(domElement, cb, autoCompile = false, script = "", id = "", isReadonly = false) {
                super(domElement, editorConstants.LangType.typescript, script, siDeclEmittor.getCurrentModuleName(), !siDeclEmittor.canWriteSI());
                this.cb = cb;
                this.autoCompile = autoCompile;
                this.compileTriggerTimoutID = INVALID_TIMER_ID;
                this.isBreakPointsLoaded = false;
                this.tsFileIndex = 1;
                this.jsFileIndex = 1;
                this.decorDebugPointMap = new Map();
                this.serverDebugPointMap = new Map();
                this.editorViewMap = new Map();
                this.DEFAULT_FILE_ICON = 'svg_file_default';
                this.iconMap = new Map();
                this.iconMap.set('css', 'svg_file_css');
                this.iconMap.set('html', 'svg_file_html');
                //this.iconMap.set('ts', 'svg_file_ts');
                this.iconMap.set('ts', 'svg_file_ts_official');
                this.iconMap.set('js', 'svg_file_js');
                this.iconMap.set('tsx', 'svg_file_tsx');
                this.iconMap.set('jsx', 'svg_file_jsx');
                this.iconMap.set('d.ts', 'svg_file_type_def');
                this.iconMap.set('json', "svg_file_json");
                this.createNewFileMenu();
                let currentSI = siDeclEmittor.getCurrentSI();
                let thisEditor = this;
                this.isSourceMapReady = false;
                this.gotoDefLine = INVALID_GO_TO_DEF_LINE;
                if (isScriptRunner()) {
                    // monaco.languages.registerHoverProvider('typescript', {
                    // 	provideHover(model: monaco.editor.ITextModel, pos: monaco.IPosition) {
                    // 		showMyTypeInfo(model, pos);
                    // 		return Promise.reject();
                    // 	}
                    // });
                    const fileName = getFileNameFromUri(this.model.uri);
                    this.createTab(fileName, true);
                    currentSI.setDirtyState(true);
                    this.selectTab(fileName);
                    if (siDeclEmittor.isSeismicComponent()) {
                        // window.recordConfig.snippets.push({
                        // 	label: 'Seismic',
                        // 	doc: 'Creates seismic component template',
                        // 	text: seismicObj.sample
                        // });
                        // window.recordConfig.snippets.push({
                        // 	label: 'seismicAll',
                        // 	doc: 'Show all seismic components',
                        // 	text: seismicObj.sampleAll
                        // });
                    }
                    ;
                    let snippets = [];
                    for (const item of window.recordConfig.snippets) {
                        snippets.push({
                            range: undefined,
                            label: 'yln_' + item.label,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: item.doc,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            insertText: item.text
                        });
                    }
                    if (snippets.length > 0) {
                        monaco.languages.registerCompletionItemProvider('typescript', {
                            provideCompletionItems: (modal, position) => {
                                if (position.lineNumber === 1 && modal.getValue().trim() === 'y')
                                    return { suggestions: snippets };
                                return { suggestions: [] };
                            }
                        });
                    }
                    this.editor.addAction({
                        id: 'Run',
                        label: 'Run',
                        contextMenuGroupId: 'modification',
                        contextMenuOrder: 3.5,
                        keybindings: [
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_R
                        ],
                        run(ed) {
                            document.getElementById(editorConstants.EL_SCRIPT_RUNNER).click();
                            return null;
                        }
                    });
                }
                else {
                    if (siDeclEmittor.isServiceNow() && !currentSI.isNew()) {
                        this.editor.addAction({
                            id: 'UpdateAndSyncDebugPoints',
                            label: 'Update & Sync DebugPoints',
                            contextMenuGroupId: 'modification',
                            contextMenuOrder: 3.8,
                            keybindings: [
                                monaco.KeyMod.CtrlCmd | monaco.KeyCode.F9
                            ],
                            run: function (ed) {
                                thisEditor.modifyDebugPoints();
                            }
                        });
                        this.editor.addAction({
                            id: 'Save',
                            label: 'Save',
                            contextMenuGroupId: 'modification',
                            contextMenuOrder: 2.5,
                            keybindings: [
                                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S
                            ],
                            run: function (ed) {
                                codeNowSettings.saveSI(null);
                            }
                        });
                    }
                }
                let isDebugPointMenuOpen = false;
                let previousTimerId = INVALID_TIMER_ID;
                let prevDebugPointLineNumber = 0;
                let bpMenuTimer = -1;
                function dismissDebugPointDialog() {
                    if (bpMenuTimer != INVALID_TIMER_ID) {
                        clearTimeout(bpMenuTimer);
                        bpMenuTimer = INVALID_TIMER_ID;
                    }
                    if (!isDebugPointMenuOpen)
                        return;
                    jQuery("#new-breakpoint-menu").removeClass("show").hide();
                    isDebugPointMenuOpen = false;
                }
                this.editor.addAction({
                    id: "FielOpen",
                    label: "FileOpen",
                    // An optional array of keybindings for the action.
                    keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P,
                    ],
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.5,
                    // Method that will be executed when the action is triggered.
                    // @param editor The editor instance is passed in as a convinience
                    run: this.openFileSelector.bind(this)
                });
                if (siDeclEmittor.isScriptRunner()) {
                    if (siDeclEmittor.isSeismicComponent())
                        jQuery('#debugger-window-icon').hide();
                    const $elm = jQuery('.workarea-resize-mode');
                    $elm.on('click', () => {
                        const resizeCls = 'resize-width';
                        const fullSizeCls = 'fullscreen-width';
                        if (!isFullScreenMode) {
                            isFullScreenMode = true;
                            $elm.removeClass('workarea-resize-mode').addClass('workarea-full-screen-mode');
                            jQuery('#right-side-area').removeClass(resizeCls).addClass(fullSizeCls).parent().css('overflow-y', 'hidden');
                        }
                        else {
                            isFullScreenMode = false;
                            $elm.removeClass('workarea-full-screen-mode').addClass('workarea-resize-mode');
                            jQuery('#right-side-area').removeClass(fullSizeCls).addClass(resizeCls).parent().css('overflow', 'hidden');
                        }
                        setTimeout(() => {
                            this.editor.layout();
                        }, 10);
                    });
                }
                function onGutterMouseAction(e) {
                    var _a;
                    if (e.target.type != monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN)
                        return;
                    let currentLineNumber = e.target.position.lineNumber;
                    if (!isDebugPointMenuOpen)
                        prevDebugPointLineNumber = currentLineNumber;
                    else {
                        if (prevDebugPointLineNumber == currentLineNumber)
                            return;
                    }
                    prevDebugPointLineNumber = currentLineNumber;
                    isDebugPointMenuOpen = true;
                    let left = e.event.browserEvent.clientX;
                    let top = e.event.browserEvent.clientY;
                    const clientState = thisEditor.getEditorDebugState();
                    const debugItem = clientState.find(item => item.client === currentLineNumber);
                    let $breakEl = jQuery('#new-breakpoint-menu');
                    let tsEditor = document.getElementById('ts_editor');
                    if (tsEditor) {
                        let tsBox = tsEditor.getBoundingClientRect();
                        top -= tsBox.top - 60;
                        if (top < 0)
                            top = 0;
                        left += 30;
                    }
                    $breakEl.find('#breakpoint-line-number').text(currentLineNumber);
                    //$breakEl.attr('data-linenumber', lineNumber);
                    let $val = $breakEl.find('#breakpoint-condition');
                    $val.attr('data-linenumber', currentLineNumber);
                    //$val.val(lineInfo?.evaluationString ?? '');
                    $val.val((_a = debugItem === null || debugItem === void 0 ? void 0 : debugItem.evaluationString) !== null && _a !== void 0 ? _a : '');
                    $breakEl.css({
                        display: "block",
                        transform: `translate(${left}px, ${top}px)`
                    }).addClass("show");
                }
                if (!this.isReadonly) {
                    this.editor.onDidChangeModel((e) => {
                        this.selectFile(getFileNameFromUri(e.newModelUrl));
                    });
                    this.editor.onDidChangeModelContent((e) => {
                        dirtyCount++;
                        this.isSourceMapReady = false;
                        if (isDebugPointMenuOpen)
                            dismissDebugPointDialog();
                        if (!siDeclEmittor.isSeismicComponent()) {
                            currentSI.setDirtyState(true);
                            currentSI.updateTSScript(this.editor.getModel().getValue());
                        }
                        if (previousTimerId != INVALID_TIMER_ID)
                            clearTimeout(previousTimerId);
                        previousTimerId = window.setTimeout(() => {
                            previousTimerId = INVALID_TIMER_ID;
                            this.onContentChanged(e);
                        }, siDeclEmittor.isSeismicComponent() ? 2000 : 5000);
                    });
                    jQuery(document).on('keyup', (e) => {
                        if (e.keyCode == 27)
                            dismissDebugPointDialog();
                    });
                    jQuery('#ts_editor_container').on('keyup', "#breakpoint-condition", (e) => {
                        if (e.keyCode == 27) {
                            dismissDebugPointDialog();
                            return;
                        }
                        if (e.keyCode == 13) {
                            let $val = jQuery(e.target);
                            let lineNumber = parseInt($val.attr('data-linenumber'));
                            let condition = $val.val();
                            this.onBreakpoint(lineNumber, condition);
                            dismissDebugPointDialog();
                        }
                    });
                    if (currentSI.canPlaceDebugPoints()) {
                        this.editor.onMouseDown(e => {
                            if (e.target.type == monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && e.event.leftButton && e.target.position.column === 1) {
                                if (currentSI.canPlaceDebugPoints() || !!window.recordConfig.breakpoints)
                                    this.onBreakpoint(e.target.position.lineNumber, editorConstants.REMOVE_DEBUG_POINT_EVALUATION_STRING);
                            }
                        });
                        if (!isScriptRunner()) {
                            this.editor.onContextMenu(e => {
                                onGutterMouseAction(e);
                            });
                            this.editor.onMouseMove(e => {
                                if (e.target.type != monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                                    if (bpMenuTimer != INVALID_TIMER_ID) {
                                        clearTimeout(bpMenuTimer);
                                        bpMenuTimer = INVALID_TIMER_ID;
                                    }
                                    return;
                                }
                                if (!isDebugPointMenuOpen) {
                                    if (bpMenuTimer != INVALID_TIMER_ID)
                                        return;
                                    bpMenuTimer = window.setTimeout(() => {
                                        onGutterMouseAction(e);
                                        bpMenuTimer = INVALID_TIMER_ID;
                                    }, 500);
                                    return;
                                }
                                onGutterMouseAction(e);
                            });
                        }
                    }
                }
                this.editor.onDidFocusEditorText(() => {
                    if (isDebugPointMenuOpen)
                        dismissDebugPointDialog();
                    if (this.gotoDefLine == INVALID_GO_TO_DEF_LINE)
                        return;
                    this.gotoDefLine = INVALID_GO_TO_DEF_LINE;
                    this.toggleEditorDebugPointsEx();
                });
                window.setTimeout(() => {
                    let line = 0;
                    if (!window.recordConfig.gotoLine)
                        return;
                    line = parseInt(window.recordConfig.gotoLine) || 0;
                    if (!line)
                        return;
                    this.gotoDefLine = line;
                    this.editor.revealPositionInCenter({ lineNumber: line, column: 0 });
                    this.toggleEditorDebugPointsEx();
                }, 10);
                if (isScriptRunner()) {
                    if (siDeclEmittor.isSeismicComponent()) {
                        const compilerOptions = Object.assign({}, tsCompilerOptions_2.default);
                        compilerOptions.jsx = monaco.languages.typescript.JsxEmit.React;
                        compilerOptions.inlineSourceMap = true;
                        compilerOptions.inlineSources = true;
                        compilerOptions.module = ts.ModuleKind.AMD;
                        compilerOptions.target = ts.ScriptTarget.Latest;
                        compilerOptions.outFile = './dist/bundle.js';
                        //	compilerOptions.outDir = './dist/';
                        Object.assign(tsCompilerOptions_2.default, compilerOptions);
                    }
                }
                else {
                    tsCompilerOptions_2.default.declaration = siDeclEmittor.isTranspiledScript();
                }
                monaco.languages.typescript.typescriptDefaults.setCompilerOptions(tsCompilerOptions_2.default);
                window.setTimeout(() => {
                    if (siDeclEmittor.isServiceNow() && !siDeclEmittor.isTranspiledScript() && !siDeclEmittor.isScriptRunner())
                        this.applyDebugPoints();
                    this.restorePreviousSessionTabs();
                }, 60);
                window.setTimeout(() => this.triggerCompilation(), 1000);
                this.moduleCompletionProvider = new ModuleCompletionProvider();
            }
            setJSInstance(value) {
                this.jsInstance = value;
            }
            createNewFileMenu() {
                if (!siDeclEmittor.isScriptRunner())
                    return;
                let allowedFiles = [];
                if (siDeclEmittor.isSeismicComponent()) {
                    allowedFiles = [
                        { ext: 'ts', title: "Typescript" },
                        { ext: 'tsx', title: 'ReactTSX' },
                        { ext: 'js', title: "Javascript" },
                        { ext: 'jsx', title: "ReactJSX" },
                        { ext: 'css', title: "style" },
                        { ext: 'json', title: 'json' }
                    ];
                }
                else {
                    allowedFiles = [
                        { ext: 'ts', title: "Typescript" },
                        { ext: 'js', title: "Javascript" }
                    ];
                }
                let menus = '';
                allowedFiles.forEach((item) => {
                    const templateEl = document.getElementById(this.iconMap.get(item.ext));
                    const li = `<li data-ext="${item.ext}">
				<a href="#" id="menu_${item.ext}">
					${templateEl.innerHTML}
					<span>${item.title}</span>
				</a>
				</li>`;
                    menus += li;
                });
                jQuery('.add-file-type').html(menus).on('click', (el) => {
                    const liEl = el.target.closest('li');
                    const ext = liEl.dataset.ext;
                    this.addFile(ext);
                });
            }
            updateReadonlyModelContent(val) {
                if (!this.jsInstance)
                    return;
                this.jsInstance.updateModelContent(val);
            }
            saveToLocalStorage() {
                if (!siDeclEmittor.isScriptRunner())
                    return;
                const obj = {};
                const cssFiles = new Array();
                monaco.editor.getModels().forEach((model) => {
                    const fileName = getFileNameFromUri(model.uri);
                    if (fileName.endsWith(editorConstants.READONLY_OUTPUT_FILE_NAME))
                        return;
                    if (/\.css$/.test(fileName))
                        cssFiles.push(fileName);
                    obj[fileName] = { source: model.getValue(), active: model === this.editor.getModel() };
                });
                cssFiles.forEach((fileName) => {
                    const [name, ext] = fileName.split('.');
                });
                delete obj[`${name}.ts`];
                localStorage.setItem(CODENOW_FS_KEY, JSON.stringify(obj));
            }
            getPreviousSessionState() {
                const result = {};
                const prevSessionJSONStr = localStorage.getItem(CODENOW_FS_KEY);
                if (typeof prevSessionJSONStr === 'string' && prevSessionJSONStr.length > 0) {
                    try {
                        const payload = JSON.parse(prevSessionJSONStr);
                        for (const fileName in payload)
                            result[fileName] = payload[fileName];
                    }
                    catch (e) { }
                }
                return result;
            }
            restorePreviousSessionTabs() {
                if (!siDeclEmittor.isScriptRunner())
                    return;
                const modelMap = new Map();
                const cssTSModels = new Set();
                monaco.editor.getModels().forEach((model) => {
                    modelMap.set(getFileNameFromUri(model.uri), model);
                });
                const lastSessionValues = this.getPreviousSessionState();
                const keys = Object.keys(lastSessionValues);
                keys.forEach((item) => {
                    if (item.endsWith('.css')) {
                        const [name, ext] = item.split('.');
                        cssTSModels.add(name + '.ts');
                    }
                });
                let selectedFileName = '';
                for (const key of keys) {
                    let currentModel = null;
                    let val = lastSessionValues[key];
                    val = val || { source: '' };
                    if (typeof val.source !== 'string' || val.source.length == 0) {
                        val.source = (function () {
                            if (siDeclEmittor.isSeismicComponent())
                                return seismic_3.seismicObj.sample;
                            if (siDeclEmittor.isScriptRunner())
                                return getDefaultTemplateCode("Welcome to ServiceNow Developement IDE! 🙏");
                            if (siDeclEmittor.isTranspiledScript()) {
                                if (siDeclEmittor.getCurrentSI().isTypescript())
                                    return editorConstants.SAMPLE_TS_CONTENT;
                                else
                                    return editorConstants.SAMPLE_JS_CONTENT;
                            }
                            return editorConstants.SAMPLE_STANDARD_SI_CONTENT;
                        })();
                    }
                    this.moduleCompletionProvider.addFile(key);
                    if (modelMap.has(key)) {
                        currentModel = modelMap.get(key);
                        currentModel.setValue(val.source);
                    }
                    else {
                        currentModel = monaco.editor.createModel(val.source, editorConstants.LangType.typescript, monaco.Uri.file(key));
                        currentModel.updateOptions({
                            indentSize: 4,
                            trimAutoWhitespace: true,
                            tabSize: 4,
                            insertSpaces: false,
                        });
                        if (!cssTSModels.has(key))
                            this.createTab(key, false, !!val.active);
                    }
                    if (selectedFileName.length === 0 && !!val.active)
                        selectedFileName = key;
                }
                siDeclEmittor.loadJSXIntellisense().then((fsMap) => __awaiter(this, void 0, void 0, function* () {
                    let result = yield siDeclEmittor.getSeismicInfo();
                    console.log(result);
                    amdBundler_1.default.start(fsMap);
                }));
                this.selectFile(selectedFileName);
                dirtyCount = 0;
            }
            openFileSelector() {
                if (fileSearch_1.FileSearch.isActive())
                    return null;
                const fileDialog = new fileSearch_1.FileSearch(this.editor, (item) => {
                    var urlPath = './?sys_id=' + item.sysId;
                    if (siDeclEmittor.isServiceNow())
                        urlPath = './sys_script_include.do?sys_id=' + item.sysId; // + '#ts_editor_container';
                    window.open(urlPath);
                });
                fileDialog.open();
            }
            onDebugPointsRefreshed() {
                return __awaiter(this, void 0, void 0, function* () {
                    const monacoField = siDeclEmittor.getMonacoFieldFromCurrentSI();
                    let newState = debugPointManager_2.DebugPointManager.get().getDebugPointsFromMonacoField(monacoField);
                    this.updateBreakPoints(newState);
                });
            }
            createTab(name, isHome = false, autoActive = true) {
                const clsId = name.replace('.', '_');
                const classNames = `${clsId} clickable ${autoActive ? 'active' : ''} ${isHome ? 'home' : ''}`;
                const [fileName, ext] = name.split('.');
                let fileType = this.DEFAULT_FILE_ICON;
                if (this.iconMap.has(ext))
                    fileType = this.iconMap.get(ext);
                let fileTemplate = document.getElementById(fileType);
                let closeStr = `<i class="glyphicon glyphicon-remove close-icon" onclick="javascript: settings.onRemoveTab('${name}')"></i>`;
                let noTabPadding = '';
                if (isHome) {
                    closeStr = '';
                    noTabPadding = 'tab-no-close';
                }
                const htmlString = `<li class= '${classNames}' onclick='javascript: settings.onSelectTab("${name}")'>
				<a href="#" class="${noTabPadding}">
					${fileTemplate.innerHTML}
					<span>${fileName}</span>
					${closeStr}
				</a>
			</li>`;
                var $tabCtrl = jQuery('#file-menu-container');
                if (autoActive)
                    $tabCtrl.find('.active').removeClass('active');
                var el = $tabCtrl.find('.add-file');
                el.before(htmlString);
            }
            removeTab(name) {
                var $tabCtrl = jQuery('#file-menu-container');
                const clsId = name.replace('.', '_');
                var $tab = $tabCtrl.find('.' + clsId);
                $tab.remove();
            }
            selectTab(name) {
                const clsId = name.replace('.', '_');
                var $tabCtrl = jQuery(`#file-menu-container`);
                var $tab = $tabCtrl.find('.active');
                if ($tab.hasClass(clsId))
                    return;
                $tab.removeClass('active');
                $tabCtrl.find(`.${clsId}`).addClass('active');
            }
            addFile(fileExt = '') {
                const isTS = /(ts)x?$/.test(fileExt);
                let randomFileName = `point${isTS ? (this.tsFileIndex) : (this.jsFileIndex)}`;
                randomFileName += '.' + fileExt;
                // if (siDeclEmittor.isSeismicComponent())
                // 	randomFileName += 'x';
                let fileName = prompt(`Enter your file name e.g ${randomFileName}`, randomFileName);
                if (typeof fileName !== 'string' || fileName.length === 0)
                    return;
                let fileTokens = fileName.split('.');
                if (fileTokens.length !== 2) {
                    alert("wrong file name, file name should have an valid extension");
                    return;
                }
                if (siDeclEmittor.isSeismicComponent()) {
                    if (!(/(\.((ts|js)x?|css|html)$)/.test(fileName))) {
                        alert(`you can only add '.jsx' or '.tsx' files`);
                        return;
                    }
                }
                const ext = fileTokens[1];
                let randomFileTokens = randomFileName.split('.');
                if (randomFileName === fileName || fileTokens[0] === randomFileTokens[0]) {
                    if (isTS || ext === 'ts')
                        this.tsFileIndex++;
                    else
                        this.jsFileIndex++;
                }
                var model = monaco.editor.getModels().find((thisModel, index, arrModels) => {
                    return thisModel.uri.path === '/' + fileName;
                });
                if (model) {
                    alert('Already this file is in workspace');
                    return;
                }
                this.moduleCompletionProvider.addFile(fileName);
                this.createTab(fileName);
                let value = getDefaultTemplateCode(`"${fileName}" user 🙏`);
                let language = editorConstants.LangType.typescript;
                if (!/(ts|js)x?$/.test(ext)) {
                    value = '';
                    if (ext === 'css')
                        language = editorConstants.LangType.css;
                    else if (ext === 'html')
                        language = editorConstants.LangType.html;
                }
                let newModel = monaco.editor.createModel(value, language, monaco.Uri.file(fileName));
                newModel.updateOptions({
                    indentSize: 4,
                    trimAutoWhitespace: true,
                    tabSize: 4,
                    insertSpaces: false,
                });
                if (ext === 'css') {
                    let cssTSFileName = fileTokens[0] + '.ts';
                    monaco.editor.createModel(`export default '';`, editorConstants.LangType.typescript, monaco.Uri.file(cssTSFileName));
                    this.moduleCompletionProvider.addFile(cssTSFileName);
                }
                else {
                    this.moduleCompletionProvider.addFile(fileName);
                }
                //amdBundler.updateFile(fileName, script);
                this.editorViewMap.set(this.editor.getModel().uri.path, this.editor.saveViewState());
                this.editor.setModel(newModel);
                const currentSI = siDeclEmittor.getCurrentSI();
                currentSI.updateScriptType(fileName);
                currentSI.updateTSScript(newModel.getValue());
                currentSI.setDirtyState(true);
                const scopeName = jQuery('#scope-select').val();
                currentSI.updateAPIName(scopeName + '.' + fileName);
                //this.onContentChanged(null);
                this.dispatchCompilation();
            }
            removeFile(name) {
                let selectedModel = monaco.editor.getModels().find((currentModel) => {
                    return currentModel.uri.path === '/' + name;
                });
                if (!selectedModel)
                    return;
                const clsId = getFileNameFromUri(selectedModel.uri).replace('.', '_');
                var $tabCtrl = jQuery(`#file-menu-container`);
                if ($tabCtrl.find('.active').hasClass(clsId))
                    this.selectFile(getFileNameFromUri(this.model.uri));
                if (name.endsWith('.css')) {
                    const [fileName, ext] = name.split('.');
                    const cssTSFileName = fileName + '.ts';
                    let cssTSModel = monaco.editor.getModel(monaco.Uri.file(cssTSFileName));
                    if (cssTSModel) {
                        this.moduleCompletionProvider.removeFile(cssTSFileName);
                        this.editorViewMap.delete(cssTSModel.uri.path);
                        cssTSModel.dispose();
                    }
                    amdBundler_1.default.delteFile(cssTSFileName);
                }
                this.removeTab(name);
                amdBundler_1.default.delteFile(name);
                this.moduleCompletionProvider.removeFile(name);
                this.editorViewMap.delete(selectedModel.uri.path);
                selectedModel.dispose();
                this.saveToLocalStorage();
            }
            selectFile(name) {
                let selectedModel = monaco.editor.getModels().find((currentModel) => {
                    return currentModel.uri.path === '/' + name;
                });
                if (!selectedModel)
                    return;
                this.editorViewMap.set(this.editor.getModel().uri.path, this.editor.saveViewState());
                this.editor.setModel(selectedModel);
                if (this.editorViewMap.has(selectedModel.uri.path))
                    this.editor.restoreViewState(this.editorViewMap.get(selectedModel.uri.path));
                this.selectTab(name);
                if (siDeclEmittor.isSeismicComponent()) {
                    if (/(\.css|\.html)$/.test(name))
                        return;
                }
                const currentSI = siDeclEmittor.getCurrentSI();
                currentSI.updateScriptType(name);
                currentSI.updateTSScript(selectedModel.getValue());
                currentSI.setDirtyState(true);
                const scopeName = jQuery('#scope-select').val();
                currentSI.updateAPIName(scopeName + '.' + name);
                this.dispatchCompilation();
            }
            updateBreakPoints(debugPointState) {
                if (isScriptRunner())
                    return;
                this.convertLineNumberFromJSToTS(debugPointState).then((result) => {
                    this.serverDebugPointMap = result;
                    this.toggleEditorDebugPointsEx();
                });
            }
            modifyDebugPoints() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!siDeclEmittor.isServiceNow() || siDeclEmittor.isScriptRunner() || siDeclEmittor.isSeismicComponent())
                        return Promise.resolve();
                    const debugPointModifier = yield this.getModifiedDebugPointsEx();
                    let result = yield debugPointManager_2.DebugPointManager.get().updateDebugPoints(debugPointModifier);
                    console.log(JSON.stringify(result, null, 4));
                });
            }
            toggleDebugPointInServer(lineNumber, toBeDeleted, debugPointCondition = '') {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!siDeclEmittor.isServiceNow())
                        return;
                    if (isScriptRunner())
                        return;
                    const modifiedDebugPoints = yield this.getModifiedDebugPointsEx();
                    if (modifiedDebugPoints.isInDeleteList(lineNumber)) {
                        if (!toBeDeleted) {
                            modifiedDebugPoints.removeFromDeleteList(lineNumber);
                            modifiedDebugPoints.update(lineNumber, debugPointCondition);
                        }
                    }
                    else if (modifiedDebugPoints.isInAddList(lineNumber)) {
                        modifiedDebugPoints.removeFromAddList(lineNumber);
                        modifiedDebugPoints.delete(lineNumber);
                    }
                    else if (modifiedDebugPoints.isInUpdatedList(lineNumber)) {
                        modifiedDebugPoints.removeFromUpdateList(lineNumber);
                        modifiedDebugPoints.delete(lineNumber);
                    }
                    else {
                        if (!toBeDeleted)
                            modifiedDebugPoints.add(lineNumber, debugPointCondition);
                        else
                            modifiedDebugPoints.delete(lineNumber);
                    }
                    const monacoField = siDeclEmittor.getMonacoFieldFromCurrentSI();
                    const debugPointManager = debugPointManager_2.DebugPointManager.get();
                    yield debugPointManager.updateDebugPoints(modifiedDebugPoints);
                    const newState = debugPointManager.getDebugPoints(debugPointManager.getKeyFromMonacoField(monacoField));
                    this.updateBreakPoints(newState);
                });
            }
            getEditorDebugState() {
                const deltaDecorations = this.editor.getModel().getAllDecorations();
                const debugDecorations = deltaDecorations.filter(d => this.decorDebugPointMap.has(d.id));
                const newDebugPoints = debugDecorations.map((item) => {
                    return Object.assign(Object.assign({}, this.decorDebugPointMap.get(item.id)), { client: item.range.startLineNumber });
                });
                return newDebugPoints;
            }
            updateSourcemapQuickly() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (this.isSourceMapReady)
                        return Promise.resolve();
                    const output = yield this.getLanguageServiceOutput();
                    if (!Array.isArray(output.outputFiles))
                        return Promise.reject();
                    const sourceMapItem = output.outputFiles.find((item) => /\.js\.map$/.test(item.name));
                    yield this.applySourcemap(sourceMapItem.text);
                    return Promise.resolve();
                });
            }
            getModifiedDebugPointsEx() {
                return __awaiter(this, void 0, void 0, function* () {
                    const currentSI = siDeclEmittor.getCurrentSI();
                    const editorDebugPoints = this.getEditorDebugState();
                    const newEditorDebugPointMap = new Map();
                    editorDebugPoints.forEach((item) => {
                        item.server = item.client;
                        newEditorDebugPointMap.set(item.client, item);
                    });
                    const manager = debugPointManager_2.DebugPointManager.get();
                    const debugPointModifier = manager.getDebugPointModifer(SI_TABLE_NAME, currentSI.sys_id, SI_SCRIPT_FIELD);
                    const key = manager.getKey(SI_TABLE_NAME, currentSI.sys_id, SI_SCRIPT_FIELD);
                    const toBeDeleted = new Set(manager.getDebugLineNumbers(key));
                    if (siDeclEmittor.isTranspiledScript()) {
                        const sourceFileName = siDeclEmittor.getCurrentModuleName();
                        yield this.updateSourcemapQuickly();
                        editorDebugPoints.forEach(item => {
                            const pos = this.sourcemapConsumer.generatedPositionFor({
                                source: sourceFileName,
                                line: item.client,
                                column: 1,
                                bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
                            });
                            if (!pos.line) {
                                newEditorDebugPointMap.delete(item.client);
                                return;
                            }
                            item.server = pos.line;
                        });
                    }
                    newEditorDebugPointMap.forEach((value, key, map) => {
                        if (toBeDeleted.has(value.server)) {
                            toBeDeleted.delete(value.server);
                            return;
                        }
                        debugPointModifier.add(value.server, value.evaluationString);
                    });
                    toBeDeleted.forEach(line => debugPointModifier.delete(line));
                    return Promise.resolve(debugPointModifier);
                });
            }
            isDebugPointDeleteCondition(debugPointCondition) {
                return debugPointCondition === editorConstants.REMOVE_DEBUG_POINT_EVALUATION_STRING;
            }
            onBreakpoint(lineNumber, condition = '', column = 1) {
                const debugState = this.getEditorDebugState();
                const toBeDeleted = this.isDebugPointDeleteCondition(condition) && !!(debugState.find((item) => {
                    return item.client === lineNumber;
                }));
                if (this.isDebugPointDeleteCondition(condition))
                    condition = '';
                this.convertLineNoFromTStoJS([lineNumber]).then((result) => {
                    this.toggleDebugPointInServer(result[0], toBeDeleted, condition);
                });
            }
            canCurrentModelGetTranspiled() {
                const fileName = this.editor.getModel().uri.path;
                return !(/\.(css|html|scss|saas)$/.test(fileName));
            }
            dispatchCompilation() {
                if (this.canCurrentModelGetTranspiled()) {
                    const currentSI = siDeclEmittor.getCurrentSI();
                    currentSI.setDirtyState(true);
                    currentSI.updateTSScript(this.editor.getModel().getValue());
                    if (this.compileTriggerTimoutID != INVALID_TIMER_ID) {
                        clearTimeout(this.compileTriggerTimoutID);
                        this.compileTriggerTimoutID = INVALID_TIMER_ID;
                    }
                }
                const isTSDefined = typeof ts != "undefined";
                const isMonacoDefined = typeof monaco != "undefined";
                if (isTSDefined && isMonacoDefined)
                    this.compileTriggerTimoutID = window.setTimeout(this.triggerCompilation.bind(this), AUTO_COMPILATION_TIME);
            }
            onContentChanged(e) {
                this.isSourceMapReady = false;
                this.dispatchCompilation();
            }
            toggleEditorDebugPointsEx() {
                const edBreakPoints = new Array();
                let isBreakPointMatched = false;
                const lineCount = this.editor.getModel().getLineCount();
                const clientLineInfoMap = new Map();
                const breakPoints = [...this.serverDebugPointMap.values()].map((item) => {
                    clientLineInfoMap.set(item.client, item);
                    return item.client;
                });
                for (const bp of breakPoints) {
                    if (bp > lineCount)
                        continue;
                    const decor = {
                        range: new monaco.Range(bp, 1, bp, 1),
                        options: {
                            glyphMarginClassName: "dbg-breakpoint",
                            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                        },
                    };
                    if (this.gotoDefLine == bp) {
                        isBreakPointMatched = true;
                        decor.options.isWholeLine = true;
                        decor.options.className = 'gotoLine';
                    }
                    edBreakPoints.push(decor);
                }
                if (this.gotoDefLine != INVALID_GO_TO_DEF_LINE && this.gotoDefLine <= lineCount) {
                    if (!isBreakPointMatched) {
                        let gotoLineDecor = {
                            range: new monaco.Range(this.gotoDefLine, 1, this.gotoDefLine, 1),
                            options: {
                                isWholeLine: true,
                                className: "gotoLine"
                            }
                        };
                        edBreakPoints.push(gotoLineDecor);
                    }
                }
                const newIds = this.editor.deltaDecorations([...this.decorDebugPointMap.keys()], edBreakPoints);
                this.decorDebugPointMap = new Map();
                newIds.forEach((id, index) => {
                    const clientLineNo = edBreakPoints[index].range.startLineNumber;
                    this.decorDebugPointMap.set(id, clientLineInfoMap.get(clientLineNo));
                });
                if (this.jsInstance)
                    this.jsInstance.updateDebugPoints(breakPoints);
            }
            applyDebugPoints() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield debugPointManager_2.DebugPointManager.get().loadAllDebugPoints();
                    this.isBreakPointsLoaded = true;
                    const monacoField = siDeclEmittor.getMonacoFieldFromCurrentSI();
                    let result = debugPointManager_2.DebugPointManager.get().getDebugPointsFromMonacoField(monacoField);
                    this.updateBreakPoints(result);
                });
            }
            triggerCompilation() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!this.canCurrentModelGetTranspiled())
                        return;
                    const currentSI = siDeclEmittor.getCurrentSI();
                    this.compileTriggerTimoutID = INVALID_TIMER_ID;
                    let output = null;
                    try {
                        output = yield generateOutput();
                    }
                    catch (e) {
                        console.error(e);
                        return;
                    }
                    currentSI.updateScript(output.js);
                    currentSI.setDirtyState(false);
                    currentSI.updateDeclaration(output.declaration);
                    currentSI.updateSourcemap(output.sourceMap);
                    this.tsOuput = output;
                    if (currentSI.isJavascript()) {
                        output.linterErrors = output.linterErrors || [];
                        var monacoMarkers = output.linterErrors.map((err) => {
                            return {
                                startLineNumber: err.line,
                                endLineNumber: err.endLine || err.line,
                                startColumn: err.column,
                                endColumn: err.endColumn || err.column,
                                message: `${err.message} (${err.ruleId})`,
                                severity: monaco.MarkerSeverity.Warning,
                                source: 'ESLint',
                            };
                        });
                        monaco.editor.setModelMarkers(this.editor.getModel(), 'eslint', monacoMarkers);
                    }
                    yield this.applySourcemap(output.sourceMap);
                    if (!this.isBreakPointsLoaded)
                        this.applyDebugPoints();
                    this.cb(output);
                });
            }
            convertLineNoFromTStoJS(tsLineNumber) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!siDeclEmittor.isTranspiledScript())
                        return Promise.resolve(tsLineNumber);
                    if (!this.sourcemapConsumer)
                        return Promise.resolve(tsLineNumber);
                    yield this.updateSourcemapQuickly();
                    let result = [];
                    const fileName = siDeclEmittor.getCurrentModuleName();
                    for (let line of tsLineNumber) {
                        let jsLocation = this.sourcemapConsumer.generatedPositionFor({
                            source: fileName,
                            line: line,
                            column: 1,
                            bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
                        });
                        if (jsLocation && jsLocation.line)
                            result.push(jsLocation.line);
                    }
                    return Promise.resolve(result);
                });
            }
            convertLineNumberFromJSToTS(state) {
                const result = new Map();
                Object.keys(state.debugpoints.BREAKPOINT).forEach((lineNo) => {
                    const intLineNo = parseInt(lineNo);
                    result.set(intLineNo, { server: intLineNo, client: intLineNo, evaluationString: state.debugpoints.BREAKPOINT[lineNo].evaluationString });
                });
                if (!siDeclEmittor.isTranspiledScript() || !this.sourcemapConsumer)
                    return Promise.resolve(result);
                const newResult = new Map();
                result.forEach((item) => {
                    if (item.server < 1)
                        return;
                    const clientPos = this.sourcemapConsumer.originalPositionFor({ line: item.server, column: 1, bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND });
                    if (!clientPos.line)
                        return;
                    newResult.set(item.server, Object.assign(Object.assign({}, item), { client: clientPos.line }));
                });
                return Promise.resolve(newResult);
            }
            convertLineNoFromJSToTS(jsLineNumber) {
                if (!siDeclEmittor.isTranspiledScript())
                    return Promise.resolve(jsLineNumber);
                if (!this.sourcemapConsumer)
                    return Promise.resolve(jsLineNumber);
                let result = [];
                for (let line of jsLineNumber) {
                    let tsLocation = this.sourcemapConsumer.originalPositionFor({ line: line, column: 1, bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND });
                    if (tsLocation && tsLocation.line)
                        result.push(tsLocation.line);
                }
                return Promise.resolve(result);
            }
            applySourcemap(sourceMapStr) {
                return __awaiter(this, void 0, void 0, function* () {
                    this.sourcemapConsumer && this.sourcemapConsumer.destroy();
                    this.sourcemapConsumer = undefined;
                    if (typeof sourceMap == 'undefined')
                        return Promise.resolve(undefined);
                    this.sourcemapConsumer = yield new sourceMap.SourceMapConsumer(JSON.parse(sourceMapStr));
                    this.isSourceMapReady = true;
                    return Promise.resolve();
                });
            }
        }
        const cssFileName = editorConstants.CSS_FILE_NAME;
        const htmlFileName = editorConstants.HTML_FILE_NAME;
        const tsxFileName = editorConstants.BOOT_FILE_NAME;
        class ModuleCompletionProvider {
            constructor() {
                this.triggerCharacters = ["'", '"', '.', '/'];
                //this.moduleNames = ['point', 'point3d', 'vector', 'state', 'props', 'boot', 'styles', 'component'];
                this.moduleNames = [];
                this.moduleSet = new Set();
            }
            addFile(fileName) {
                if (!(/(\.(ts|js)x?$)/.test(fileName)))
                    return;
                this.moduleSet.add(fileName);
                this.updateModuleNames();
            }
            removeFile(fileName) {
                if (!this.moduleSet.has(fileName))
                    return;
                this.moduleSet.delete(fileName);
                this.updateModuleNames();
            }
            updateModuleNames() {
                this.moduleNames = this.moduleNames = [...this.moduleSet].map((item) => {
                    const [name, ext] = item.split('.');
                    return name;
                });
                ;
            }
            provideCompletionItems(model, position, context, token) {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                });
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                const suggestions = [];
                const lineContent = model.getLineContent(position.lineNumber);
                if (/^import /.test(lineContent) && (textUntilPosition.endsWith('.') || textUntilPosition.endsWith('/'))) {
                    const [currentFileName] = getFileNameFromUri(model.uri).split('.');
                    this.moduleNames.forEach((item) => {
                        if (currentFileName === item)
                            return;
                        suggestions.push({
                            range,
                            label: item,
                            insertText: textUntilPosition.endsWith('.') ? '/' + item : item,
                            kind: monaco.languages.CompletionItemKind.Module
                        });
                    });
                }
                return { suggestions };
            }
        }
        class MonacoTSXEditor extends MonacoTSEditor {
            constructor(domElement, cb, autoCompile = false, script = "", id = "", isReadonly = false) {
                super(domElement, cb, autoCompile, script, id, isReadonly);
                this.seismicContentUpdateTimerId = INVALID_TIMER_ID;
                this.prevPayload = {
                    jsx: '',
                    style: '',
                    html: ''
                };
                this.registerForCMD();
                siDeclEmittor.loadJSXIntellisense();
                this.addSeismicCSSAndHTML();
                //this.moduleCompletionProvider = new ModuleCompletionProvider();
                monaco.languages.registerCompletionItemProvider('typescript', this.moduleCompletionProvider);
            }
            openFileSelector() {
                if (!siDeclEmittor.isServiceNow())
                    return;
                const fiddleTemplateNode = document.getElementById('fiddle_select_template');
                const cloneNode = fiddleTemplateNode.content.cloneNode(true).firstChild;
                document.body.appendChild(cloneNode);
                const $modalEl = jQuery('#fiddle_select');
                const closeCallback = () => {
                    $modalEl.off('hidden.bs.modal', closeCallback);
                    document.body.removeChild(cloneNode);
                };
                $modalEl.on('show', () => {
                    $('.modal-body', this).css({ width: 'auto', height: 'auto', 'max-height': '100%' });
                });
                $modalEl.on('hidden.bs.modal', closeCallback);
                window['changeFiddle'] = function (newFid) {
                    $modalEl.modal('hide');
                    const url = new URL(location.href);
                    const searchParms = url.searchParams;
                    searchParms.set('fid', newFid);
                    location.href = url.toString();
                };
                $modalEl.modal();
            }
            getPreviousSessionState() {
                return window.recordConfig.uxfRecord.payload;
            }
            addSeismicCSSAndHTML() {
                const lastSessionValues = window.recordConfig.uxfRecord.payload;
                this.cssModel = monaco.editor.createModel(lastSessionValues[cssFileName].source, editorConstants.LangType.css, monaco.Uri.file(cssFileName));
                this.htmlModel = monaco.editor.createModel(lastSessionValues[htmlFileName].source, editorConstants.LangType.html, monaco.Uri.file(htmlFileName));
                this.cssModel.updateOptions({
                    indentSize: 4,
                    trimAutoWhitespace: true,
                    tabSize: 4,
                    insertSpaces: false,
                });
                this.htmlModel.updateOptions({
                    indentSize: 4,
                    trimAutoWhitespace: true,
                    tabSize: 4,
                    insertSpaces: false,
                });
                this.createTab(cssFileName, true, false);
                this.createTab(htmlFileName, true, false);
            }
            getPlayload() {
                return __awaiter(this, void 0, void 0, function* () {
                    const payload = {
                        [htmlFileName]: {
                            source: this.htmlModel.getValue(),
                            active: this.htmlModel === this.editor.getModel()
                        },
                        [cssFileName]: {
                            source: this.cssModel.getValue(),
                            active: this.cssModel === this.editor.getModel()
                        }
                    };
                    const models = monaco.editor.getModels();
                    const cssTSFileNames = [];
                    const activeModelUri = this.model.uri.toString();
                    models.forEach((model) => {
                        let fileName = getFileNameFromUri(model.uri);
                        if (fileName.endsWith('.css')) {
                            const [name, ext] = fileName.split('.');
                            cssTSFileNames.push(name + '.ts');
                        }
                        payload[fileName] = {
                            source: model.getValue(),
                            active: model.uri.toString() === activeModelUri
                        };
                    });
                    cssTSFileNames.forEach((item) => {
                        delete payload[item];
                    });
                    //let result = await this.handleSeismicContentChangesAMD();
                    return Promise.resolve(payload);
                });
            }
            share() {
                return __awaiter(this, void 0, void 0, function* () {
                    const payload = this.getPlayload();
                    return payload;
                });
            }
            share1() {
                return __awaiter(this, void 0, void 0, function* () {
                    const payload = {
                        [htmlFileName]: {
                            source: this.htmlModel.getValue(),
                            active: this.htmlModel === this.editor.getModel()
                        },
                        [cssFileName]: {
                            source: this.cssModel.getValue(),
                            active: this.cssModel === this.editor.getModel()
                        }
                    };
                    let models = monaco.editor.getModels();
                    const uxfRecord = window.recordConfig.uxfRecord;
                    models = models.filter(m => m.uri.path.search(/((js|ts)x)$/g) > 0);
                    models.forEach((model, index) => __awaiter(this, void 0, void 0, function* () {
                        const fileName = getFileNameFromUri(model.uri);
                        const worker = yield monaco.languages.typescript.getTypeScriptWorker();
                        const client = yield worker(model.uri);
                        const output = yield client.getEmitOutput(model.uri.toString());
                        payload[fileName] = {
                            source: model.getValue(),
                            transpiledValue: output.outputFiles[0].text,
                            active: model === this.editor.getModel()
                        };
                        if (index !== models.length - 1)
                            return;
                        let url = editorConstants.FIDDLE_TABLE_URL;
                        const isNewFiddle = siDeclEmittor.isNewFiddle();
                        const record = {
                            payload: JSON.stringify(payload)
                        };
                        const newShortDescription = prompt("Enter short description for fiddle", uxfRecord.short_description ? uxfRecord.short_description : "Super feature demo");
                        if (!newShortDescription)
                            return;
                        record.short_description = newShortDescription;
                        if (!isNewFiddle)
                            url += `/${uxfRecord.sys_id}`;
                        const el = document.getElementById(editorConstants.EL_SCRIPT_RUNNER);
                        //el.innerText = 'Updating ...';
                        let resp = yield codenowUtils_5.CodeNowUtils.snFetch(url, {
                            body: JSON.stringify(record),
                            method: siDeclEmittor.isNewFiddle() ? 'POST' : 'PATCH'
                        }, true);
                        const result = resp.result;
                        Object.assign(uxfRecord, result);
                        uxfRecord.payload = JSON.parse(uxfRecord.payload);
                        //el.innerText = "Update";
                        for (const prop in payload)
                            delete payload[prop].transpiledValue;
                        localStorage.setItem(CODENOW_FS_KEY, JSON.stringify(payload));
                        dirtyCount = 0;
                        if (isNewFiddle) {
                            const newUrl = new URL(location.href);
                            newUrl.searchParams.set('fid', result.sys_id);
                            history.pushState({ sysId: result.sys_id }, document.title, newUrl.href);
                        }
                    }));
                });
            }
            registerForCMD() {
                return __awaiter(this, void 0, void 0, function* () {
                    window.addEventListener('message', (e) => {
                        if (e.origin !== new URL(location.href).origin)
                            return;
                        // if(e.data.cmd === 'codenowSeismicPlaygroundReady') {
                        // 	if(this.outputWindow) {
                        // 		const payload = {cmd: 'codenowSeismicPlayload'};
                        // 		const finalPayload = Object.assign(payload, this.prevPayload);
                        // 		this.outputWindow.postMessage(finalPayload, location.href);
                        // 	}
                        // }
                        console.log('msg came ' + e.data);
                    });
                    const menuWrapper = document.getElementById('cmd_group_template');
                    const timerEl = document.getElementById('excution-timer');
                    const el = document.getElementById(editorConstants.EL_SCRIPT_RUNNER);
                    //el.innerText = siDeclEmittor.isNewFiddle() ? "Share" : "Update";
                    let startTime = Date.now();
                    let done = false;
                    const executionTimerFn = () => {
                        let currentTime = Date.now();
                        var diff = currentTime - startTime;
                        //startTime = currentTime;
                        var r = convertMS(diff);
                        let str = r.minute + ':' + r.seconds + ':' + r.ms;
                        timerEl.innerText = str;
                        if (!done)
                            window.requestAnimationFrame(executionTimerFn);
                    };
                    jQuery(el.parentElement).append(menuWrapper.innerHTML).on('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        let target = e.target.closest('.cmd');
                        if (!target)
                            return;
                        const cmd = target.dataset.cmd;
                        if (typeof cmd !== 'string')
                            return;
                        switch (cmd) {
                            case 'run':
                                {
                                    startTime = Date.now();
                                    done = false;
                                    executionTimerFn();
                                    const cmdBtn = target;
                                    cmdBtn.disabled = true;
                                    try {
                                        yield this.handleSeismicContentChangesAMD();
                                    }
                                    finally {
                                        done = true;
                                        cmdBtn.disabled = false;
                                    }
                                }
                                break;
                            case 'new':
                                // if (siDeclEmittor.isNewFiddle())
                                // 	return;
                                const newUrl = new URL(location.href);
                                location.href = newUrl.origin + newUrl.pathname + '?sysparm_nostack=true&isSeismic=true';
                                break;
                            case 'open':
                                this.openFileSelector();
                                break;
                            case 'save_to_local':
                                try {
                                    const payload = yield this.getPlayload();
                                    localStorage.setItem(CODENOW_FS_KEY, JSON.stringify(payload));
                                    dirtyCount = 0;
                                }
                                finally {
                                }
                                break;
                            case 'share':
                                this.share();
                                break;
                        }
                    }));
                    // el.addEventListener('click', async (e) => {
                    // 	el.disabled = true;
                    // 	try {
                    // 		await this.handleSeismicContentChangesAMD();
                    // 	} finally {
                    // 		el.disabled = false;
                    // 	}
                    // });
                });
            }
            onContentChanged(e) {
                return this.handleSeismicContentChanges();
            }
            triggerCompilation() {
                if (siDeclEmittor.isSeismicComponent())
                    return Promise.resolve(this.handleSeismicContentChanges());
                return Promise.resolve();
            }
            renderSeismicComponent(depModules) {
                const payload = {
                    jsx: this.jsxValue,
                    style: this.cssModel.getValue(),
                    html: this.htmlModel.getValue(),
                    deps: depModules
                };
                // const isSame = this.prevPayload.jsx === payload.jsx && this.prevPayload.style === payload.style && this.prevPayload.html === payload.html;
                // if (isSame)
                // 	return;
                // if (compilerOptions.module !== ts.ModuleKind.None) {
                // 	const result = ts.preProcessFile(this.editor.getModel().getValue(), true, true);
                // 	console.log(result);
                // 	return;
                // }
                this.prevPayload = payload;
                window['getComponent'] = function () {
                    return payload;
                };
                jQuery('a[href="#script-output"]')["tab"]('show');
                if (this.outputWindow) {
                    this.outputWindow.postMessage({ cmd: 'codenowSeismicUpdated' }, location.href);
                    return;
                }
                const scriptRunnerEl = jQuery('#' + editorConstants.EL_SCRIPT_OUTPUT);
                const iframe = document.createElement('iframe');
                iframe.id = 'seismic_host';
                iframe.style.width = '1024px';
                iframe.style.height = '768px';
                iframe.style.border = '1px solid darkgray';
                if (siDeclEmittor.isServiceNow())
                    iframe.src = `seismic_playground.do?sysparm_nostack=true&cache=${Date.now()}`;
                else
                    iframe.src = `./PluginLoader/index.html?cache=${Date.now()}`;
                iframe.onload = () => {
                    this.outputWindow = iframe.contentWindow;
                };
                scriptRunnerEl.html(iframe);
            }
            handleSeismicContentChangesAMD() {
                return __awaiter(this, void 0, void 0, function* () {
                    const fsMap = new Map();
                    monaco.editor.getModels().map((model) => {
                        let fileName = getFileNameFromUri(model.uri);
                        if (fileName.endsWith(editorConstants.READONLY_OUTPUT_FILE_NAME))
                            return;
                        if (!(/(\.((ts|js)x?|css)$)/.test(fileName)))
                            return;
                        const modelId = model.getModeId();
                        if (!/(typescript|javascript|css)/.test(modelId))
                            return;
                        let value = model.getValue();
                        if (/\.css$/.test(fileName)) {
                            const [name, ext] = fileName.split('.');
                            //TODO: find alternatives for importing css files.
                            fileName = `${name}.ts`;
                            value = `export default \`${value}\`;`;
                        }
                        if (!fsMap.get(fileName)) // we have overrided the css to ts value;
                            fsMap.set(fileName, value);
                    });
                    const preprocessModuleResults = new Map();
                    const depModules = new Set();
                    yield Promise.all([...fsMap.keys()].map((fileName) => __awaiter(this, void 0, void 0, function* () {
                        let result = ts.preProcessFile(fsMap.get(fileName), true, true);
                        result.importedFiles.forEach((item) => {
                            if (!item.fileName.startsWith('./'))
                                depModules.add(item.fileName);
                        });
                        preprocessModuleResults.set(fileName, result);
                        return amdBundler_1.default.updateFile(fileName, fsMap.get(fileName));
                    })));
                    const depInfo = siDeclEmittor.getExternalResults(depModules);
                    console.log(depInfo);
                    let prevTime = Date.now();
                    let result = yield amdBundler_1.default.getBundle();
                    console.log('emit time is ' + (Date.now() - prevTime));
                    if (result.emitSkipped)
                        return Promise.reject(result);
                    let [jsxOutput, declOutput] = [...result.outputFiles];
                    this.updateReadonlyModelContent(jsxOutput.text);
                    const tsDecl = document.getElementById(editorConstants.EL_TS_DECL);
                    if (tsDecl) {
                        const decl = declOutput.text.replace(/</gi, '&lt;');
                        tsDecl.innerHTML = decl;
                        monaco.editor.colorizeElement(tsDecl, { theme: defaultTheme });
                    }
                    this.jsxValue = jsxOutput.text;
                    const jsxTags = this.jsxValue.match(/create(JSX)?Element\(('|")([A-Za-z\\-]){1,}/gm);
                    const customTagSet = new Set(depInfo.customTags);
                    if (Array.isArray(jsxTags)) {
                        jsxTags.forEach((val) => {
                            val = val.replace(/create(JSX)?Element\(('|")/g, '').trim();
                            val = val.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
                            if (/[\\-]/g.test(val) && !customTagSet.has(val))
                                customTagSet.add(val);
                        });
                    }
                    const jsOutputEl = document.getElementById('tab-js-ouput');
                    if (!jsOutputEl) {
                        this.renderSeismicComponent(depInfo);
                        return result;
                    }
                    if (this.seismicContentUpdateTimerId !== INVALID_TIMER_ID) {
                        window.clearTimeout(this.seismicContentUpdateTimerId);
                        this.seismicContentUpdateTimerId = INVALID_TIMER_ID;
                    }
                    return new Promise((resolve, reject) => {
                        this.seismicContentUpdateTimerId = window.setTimeout(() => {
                            this.renderSeismicComponent(depInfo);
                            resolve(result);
                        }, 1000);
                    });
                });
            }
            handleSeismicContentChanges() {
                return __awaiter(this, void 0, void 0, function* () {
                    return Promise.resolve();
                    return this.handleSeismicContentChangesAMD();
                    if (this.canCurrentModelGetTranspiled() || this.prevPayload.jsx.length === 0) {
                        let currentModel = this.editor.getModel();
                        if (this.prevPayload.jsx.length === 0) {
                            currentModel = monaco.editor.getModels().find((model) => {
                                return getFileNameFromUri(model.uri) === siDeclEmittor.getCurrentModuleName();
                            });
                        }
                        const worker = (yield monaco.languages.typescript.getTypeScriptWorker());
                        const client = (yield worker(currentModel.uri));
                        const output = yield client.getEmitOutput(currentModel.uri.toString());
                        if (output.emitSkipped)
                            return;
                        const payload = output.outputFiles.find((item) => {
                            return /(\.js)$/.test(item.name);
                        });
                        this.jsxValue = payload.text;
                        this.updateReadonlyModelContent(payload.text);
                    }
                    if (this.seismicContentUpdateTimerId !== INVALID_TIMER_ID) {
                        window.clearTimeout(this.seismicContentUpdateTimerId);
                        this.seismicContentUpdateTimerId = INVALID_TIMER_ID;
                    }
                    this.seismicContentUpdateTimerId = window.setTimeout(() => {
                        this.renderSeismicComponent();
                    }, 1000);
                });
            }
        }
        function initialize(siName, langType = editorConstants.LangType.typescript) {
            var _a, _b, _c;
            let currentSI = siDeclEmittor.getCurrentSI();
            const tsEditorEl = document.getElementById(editorConstants.EL_TS_EDITOR);
            const jsEditorEl = document.getElementById(editorConstants.EL_JS_EDITOR);
            let jsEditor;
            const tsDecl = document.getElementById(editorConstants.EL_TS_DECL);
            const tsSourceMap = document.getElementById(editorConstants.EL_TS_SOURCEMAP);
            function onTextChange(tsResult) {
                if (typeof g_form != 'undefined') {
                    g_form.setValue(editorConstants.FIELD_SCRIPT, tsResult.js);
                    g_form.setValue(editorConstants.FIELD_DECLARATION, tsResult.declaration);
                    g_form.setValue(editorConstants.FIELD_TS_SCRIPT, tsResult.tsScript);
                    g_form.setValue(editorConstants.FIELD_SOURCEMAP, tsResult.sourceMap);
                }
                if (jsEditor)
                    jsEditor.updateModelContent(tsResult.js);
                if (tsDecl) {
                    let decl = '';
                    if (tsResult.declaration.length != 0)
                        decl = siDeclEmittor.getCurrentSI().formatForAddLib(JSON.parse(tsResult.declaration), currentSI.getScopeAndAPIMap().scope);
                    //tsDecl.innerText = decl;
                    decl = decl.replace(/</gi, '&lt;');
                    tsDecl.innerHTML = decl;
                    if (decl.length != 0)
                        monaco.editor.colorizeElement(tsDecl, { theme: defaultTheme });
                }
                if (!!tsSourceMap)
                    tsSourceMap.innerText = tsResult.sourceMap;
            }
            if (siDeclEmittor.isSeismicComponent()) {
                currentSI.tsscript = (_c = (_b = (_a = window === null || window === void 0 ? void 0 : window.recordConfig) === null || _a === void 0 ? void 0 : _a.uxfRecord) === null || _b === void 0 ? void 0 : _b.payload[tsxFileName]) === null || _c === void 0 ? void 0 : _c.source;
                currentSI.tsscript = currentSI.tsscript || '';
                monacoInstance = new MonacoTSXEditor(tsEditorEl, onTextChange, true, currentSI.tsscript);
            }
            else
                monacoInstance = new MonacoTSEditor(tsEditorEl, onTextChange, true, currentSI.tsscript);
            if (jsEditorEl) {
                jsEditor = new MonacoJSEditor(jsEditorEl, "// wating ...", true);
                monacoInstance.setJSInstance(jsEditor);
                window['jsInstnace'] = jsEditor;
            }
            window["tsInstance"] = monacoInstance;
            if (siDeclEmittor.isServiceNow() && !siDeclEmittor.isSeismicComponent()) {
                if (currentSI.canPlaceDebugPoints() || siDeclEmittor.isScriptRunner()) {
                    //if (siDeclEmittor.isScriptRunner())
                    debugPointManager_2.DebugPointManager.get().loadAllDebugPoints();
                    debugPointManager_2.DebugPointManager.get().initializeWatcher(siDeclEmittor.isScriptRunner() ? SI_TEMP_DEBUGGER_SYS_ID : currentSI.sys_id);
                    document.addEventListener(editorConstants.DEBUG_POINTS_MODIFIED_EVENT, () => {
                        if (!siDeclEmittor.isScriptRunner())
                            monacoInstance.onDebugPointsRefreshed();
                    });
                }
            }
            return {
                dispose() {
                }
            };
        }
        function getEditorLocalConfig() {
            var r = localStorage.getItem("sn.codenow");
            var defaultConfig = {
                theme: defaultTheme
            };
            if (!r)
                return defaultConfig;
            var result = JSON.parse(r);
            result.theme = result.theme || defaultConfig.theme;
            //if (!isScriptRunner())
            //result.theme = defaultTheme;
            return result;
        }
        function updateEditorLocalConfig(newConfig) {
            const p = getEditorLocalConfig();
            for (const prop in newConfig)
                p[prop] = newConfig[prop];
            //if (isScriptRunner())
            localStorage.setItem("sn.codenow", JSON.stringify(p));
        }
        let themeSelector = document.getElementById(editorConstants.EL_THEME_SELECT);
        function changeTheme(newTheme) {
            jQuery('#yln-standalone-editor').removeClass(defaultTheme).addClass(newTheme);
            defaultTheme = newTheme;
            monaco.editor.setTheme(defaultTheme);
            updateEditorLocalConfig({ theme: newTheme });
            jQuery(themeSelector).val(newTheme);
        }
        function listenForConfigChanges() {
            if (themeSelector) {
                themeSelector.onchange = function () {
                    changeTheme(themeSelector.value);
                };
            }
            if (siDeclEmittor.isSeismicComponent()) {
                jQuery('#' + editorConstants.EL_SCOPE_SELECT).hide();
                jQuery(`#UpdateSI`).hide();
                jQuery('#UpdateTableAPI').hide();
                return;
            }
            let scopeSelect = document.getElementById(editorConstants.EL_SCOPE_SELECT);
            if (scopeSelect) {
                var str = '';
                var siConfig = window.recordConfig;
                for (let scopeSysId in siConfig.scopes) {
                    let item = siConfig.scopes[scopeSysId];
                    if (item.sysId != 'global')
                        str += `<option value='${item.value}' scope-id='${item.sysId}'>${item.displayValue}</option>\n`;
                }
                str = `<option value='global' scope-id='global' selected>Global</option>\n` + str.trim();
                scopeSelect.innerHTML = str;
                scopeSelect.onchange = function () {
                    let scopeName = scopeSelect.value;
                    let currentSI = siDeclEmittor.getCurrentSI();
                    currentSI.updateAPIName(scopeName + '.');
                    siDeclEmittor.siUpdated();
                };
            }
            function getDebuggerStatementLineNumbers(str) {
                var tokens = str.split('\n');
                var lineNumbers = [];
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i].match(/^\s*debugger;\s?/)) {
                        lineNumbers.push(i + 2);
                        tokens[i] = '"debugger";';
                    }
                }
                return { dbgStatements: lineNumbers, js: tokens.join('\n') };
            }
            ;
            let btnScriptRun = document.getElementById(editorConstants.EL_SCRIPT_RUNNER);
            if (!siDeclEmittor.isServiceNow()) {
                if (!siDeclEmittor.isSeismicComponent())
                    jQuery(btnScriptRun).hide();
            }
            if (btnScriptRun && siDeclEmittor.isServiceNow()) {
                btnScriptRun.onclick = function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        //jQuery('a[href="#script-output"]')["tab"]('show');
                        if (!siDeclEmittor.isServiceNow())
                            return;
                        btnScriptRun.disabled = true;
                        let currentSI = siDeclEmittor.getCurrentSI();
                        var scopeSysId = scopeSelect.selectedOptions[0].getAttribute('scope-id');
                        function onRun(script) {
                            return __awaiter(this, void 0, void 0, function* () {
                                jQuery('a[href="#script-output"]')["tab"]('show');
                                var scriptRunnerEl = jQuery('#' + editorConstants.EL_SCRIPT_OUTPUT);
                                let startTime = Date.now();
                                var done = false;
                                var exEl = document.getElementById('excution-timer');
                                var scriptRunnerEl = jQuery('#' + editorConstants.EL_SCRIPT_OUTPUT);
                                var str = `<div class = "script-running">
							<i class="glyphicon glyphicon-refresh spin"></i>
							</div>`;
                                scriptRunnerEl.html(str);
                                const fn = () => {
                                    let currentTime = Date.now();
                                    var diff = currentTime - startTime;
                                    //startTime = currentTime;
                                    var r = convertMS(diff);
                                    let str = r.minute + ':' + r.seconds + ':' + r.ms;
                                    exEl.innerText = str;
                                    if (!done)
                                        window.requestAnimationFrame(fn);
                                };
                                fn();
                                try {
                                    const data = yield runScriptUsingJQuery(script, scopeSysId);
                                    const domParser = new DOMParser();
                                    const runDoc = domParser.parseFromString(data, 'text/html');
                                    jQuery('#' + editorConstants.EL_SCRIPT_OUTPUT).html(runDoc.body.innerHTML);
                                }
                                catch (e) {
                                    console.error(' Found error ' + e);
                                }
                                finally {
                                    done = true;
                                    btnScriptRun.disabled = false;
                                }
                                ;
                                return Promise.resolve();
                            });
                        }
                        function updateBreakpointsAndRun(js) {
                            return __awaiter(this, void 0, void 0, function* () {
                                const afterDbg = getDebuggerStatementLineNumbers(js);
                                const breakpoints = afterDbg.dbgStatements;
                                const jsTokensWithoutSourceMap = afterDbg.js.split('\n');
                                if (jsTokensWithoutSourceMap.length > 0) {
                                    jsTokensWithoutSourceMap.splice(jsTokensWithoutSourceMap.length - 1, 1);
                                }
                                js = jsTokensWithoutSourceMap.join('\n');
                                if (breakpoints.length == 0)
                                    return yield onRun(js);
                                const scopeSysId = scopeSelect.selectedOptions[0].getAttribute('scope-id');
                                let actionResult = yield codenowUtils_5.CodeNowUtils.doAction({ cmd: codenowUtils_5.CodeNowActionTypes.update_debugger_script, script: `function ${SI_TEMP_DEBUGGET_NAME}(){\n${js}\n};`, scope: scopeSysId });
                                if (!codenowUtils_5.CodeNowUtils.isSuccessful(actionResult)) {
                                    alert("failed to do execute the action " + JSON.stringify(actionResult));
                                    btnScriptRun.disabled = false;
                                    return;
                                }
                                const key = `sys_script_include.${actionResult.sysId}.script`;
                                const lineNumbers = debugPointManager_2.DebugPointManager.get().getDebugLineNumbers(key);
                                const debugPointModifier = debugPointManager_2.DebugPointManager.get().getDebugPointModifer(SI_TABLE_NAME, actionResult.sysId, SI_SCRIPT_FIELD);
                                let existingDebugSet = new Set(lineNumbers);
                                breakpoints.forEach((lineNo) => {
                                    if (existingDebugSet.has(lineNo)) {
                                        existingDebugSet.delete(lineNo);
                                        return;
                                    }
                                    debugPointModifier.add(lineNo);
                                });
                                existingDebugSet.forEach((val) => {
                                    debugPointModifier.delete(val);
                                });
                                yield debugPointManager_2.DebugPointManager.get().updateDebugPoints(debugPointModifier);
                                return yield onRun(`${actionResult.apiName}()`);
                            });
                        }
                        if (currentSI.isUpToDate()) {
                            updateBreakpointsAndRun(currentSI.script);
                            return;
                        }
                        try {
                            const tsResult = yield generateOutput();
                            updateBreakpointsAndRun(tsResult.js);
                        }
                        catch (e) {
                            alert(e);
                            btnScriptRun.disabled = false;
                        }
                        // generateOutput().then((tsresult) => {
                        // 	updateBreakpointsAndRun(tsresult.js);
                        // }, (reason) => {
                        // 	alert(reason);
                        // 	btnScriptRun.disabled = false;
                        // });
                    });
                };
            }
        }
        function MyInit() {
            if (!siDeclEmittor.isServiceNow()) {
                window.recordConfig.scopes = editorConstants.scopes;
                window.recordConfig.snippets = editorConstants.snippets;
            }
            listenForConfigChanges();
            function recenterEditor() {
                let $scrollEl = jQuery(document.getElementById("sys_script_include.form_scroll"));
                let scrollOffset = $scrollEl.offset();
                if (scrollOffset) {
                    let editorOffset = jQuery('#ts_editor_container').offset();
                    if (editorOffset) {
                        let diff = editorOffset.top - scrollOffset.top;
                        if (diff > 0)
                            $scrollEl.scrollTop(diff);
                    }
                }
            }
            changeTheme(getEditorLocalConfig().theme);
            var config = window.recordConfig;
            if (siDeclEmittor.isServiceNow()) {
                if (config.isNewRecord) {
                    const csi = new siParser.ClientSIRecordData(undefined, true);
                    csi.updateLangType(window.recordConfig.langType);
                    siDeclEmittor.initializeWithSIRecord(csi).then(() => {
                        initialize("", (config.langType || editorConstants.LangType.javascript));
                        if (!isScriptRunner() && !siDeclEmittor.getCurrentSI().isNew())
                            recenterEditor();
                    });
                }
                else {
                    const csRec = siParser.ClientSIRecordData.fromSIRec(window.recordConfig.siRec);
                    siParser.ClientSIRecordData.convertToJSConstructor(csRec);
                    siDeclEmittor.initializeWithSIRecord(csRec).then(() => {
                        initialize(config.apiName, (config.langType || editorConstants.LangType.javascript));
                        if (!isScriptRunner())
                            recenterEditor();
                    });
                }
            }
            else {
                const csi = new siParser.ClientSIRecordData();
                csi.updateAPIName(config.apiName);
                csi.updateLangType(config.langType);
                siDeclEmittor.initializeWithSIRecord(csi).then(() => {
                    initialize(config.apiName, (config.langType || editorConstants.LangType.javascript));
                });
            }
        }
        // this works only if script length is below 2000 charater ( tested with 1000)
        function runScriptUsingURLParams() {
            (function () {
                var request = new XMLHttpRequest();
                // POST to httpbin which returns the POST data as JSON
                var url = './sys.scripts.do?script=' + encodeURIComponent('gs.info("hello")');
                url += '&sysparm_ck=' + window.g_ck;
                url += '&runscript=' + encodeURIComponent('Run script');
                request.open('POST', url, /* async = */ false);
                request.send();
                console.log(request.response);
            });
        }
        //https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript
        function getScriptToRun(jsScript = "gs.info('hello yln')", scopeSysId = '0f6ab99a0f36060094f3c09ce1050ee8') {
            var data = {
                "script": jsScript,
                "sysparm_ck": window.g_ck,
                "runscript": "Run script",
                "sys_scope": scopeSysId
            };
            var urlEncodedData = "";
            var urlEncodedDataPairs = [];
            // Turn the data object into an array of URL-encoded key/value pairs.
            for (let name in data)
                urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
            // Combine the pairs into a single string and replace all %-encoded spaces to
            // the '+' character; matches the behaviour of browser form submissions.
            urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
            return urlEncodedData;
        }
        function runScriptUsingXMLHTTPRequest(urlEncodedData = getScriptToRun()) {
            var XHR = new XMLHttpRequest();
            // Define what happens on successful data submission
            XHR.addEventListener('load', function (event) {
                alert('Yeah! Data sent and response loaded.');
            });
            // Define what happens in case of error
            XHR.addEventListener('error', function (event) {
                alert('Oops! Something goes wrong.');
            });
            XHR.onreadystatechange = function (ev) {
                if (XHR.readyState === 4 && XHR.status === XHR.DONE) {
                    console.log(XHR.responseText);
                }
            };
            // Set up our request
            XHR.open('POST', './sys.scripts.do');
            // Add the required HTTP header for form data POST requests
            XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            // Finally, send our data.
            XHR.send(urlEncodedData);
        }
        function runScriptUsingJQuery(jsScript, scopeId) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield codenowUtils_5.CodeNowUtils.snFetch('/sys.scripts.do', {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    body: getScriptToRun(jsScript, scopeId)
                }, false);
                return (yield result).text();
            });
        }
        function startDebugger() {
            const currentSI = siDeclEmittor.getCurrentSI();
            if (!siDeclEmittor.isScriptRunner() && !currentSI.canPlaceDebugPoints())
                return;
            const sysId = siDeclEmittor.isScriptRunner() ? SI_TEMP_DEBUGGER_SYS_ID : currentSI.sys_id;
            debugPointManager_2.DebugPointManager.get().startDebugger(SI_TABLE_NAME, sysId, SI_SCRIPT_FIELD);
        }
        ;
        function updateCompiler() {
            let options = siDeclEmittor.getCompilerOptions(siDeclEmittor.getCurrentSI().isJavascript(), siDeclEmittor.isTranspiledScript());
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
            var tsInstance = monacoInstance;
            tsInstance.triggerCompilation();
        }
        function openBootstrapModal($el, $waitEl, $modalEl) {
            // $el.attr('disabled', 'disabled');
            // $waitEl.removeClass('hide');
            function callback() {
                $modalEl.off('hidden.bs.modal', callback);
                $el.removeAttr('disabled');
                $waitEl.addClass('hide');
            }
            $modalEl.on('hidden.bs.modal', callback);
            $modalEl.modal();
        }
        function showMessage(msg, type, duration = 2500) {
            if (typeof GlideUI == 'undefined') {
                alert(msg);
                return;
            }
            let span = document.createElement('span');
            span.setAttribute('data-type', type);
            span.setAttribute('data-text', msg);
            span.setAttribute('data-duration', duration + '');
            GlideUI.get().fire(new GlideUINotification({
                xml: span
            }));
        }
        let saveMessageTimer = -1;
        const codeNowSettings = {
            startDebugger: startDebugger,
            //FIXME: disable when this is not in respective scope.
            saveSI(el) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (saveMessageTimer == -1 && el) {
                        saveMessageTimer = window.setTimeout(() => {
                            saveMessageTimer = -1;
                        }, 60 * 1000);
                        showMessage("You can use \` CMD/CTRL + s \` keyboard shorcut to save the script. It's pretty handy!", "info", 10000);
                    }
                    if (!el)
                        el = document.getElementById("codenow.savesi");
                    var $el = jQuery(el);
                    var $waitEl = $el.find('>i');
                    $el.attr('disabled', 'disabled');
                    $waitEl.removeClass('hide');
                    let result;
                    let isError = false;
                    try {
                        result = yield generateOutput(true);
                        let js = siParser.ClientSIRecordData.getClassConstructorFormat(siDeclEmittor.getCurrentSI());
                        let data = {
                            js: js,
                            decl: result.backEndDecl,
                            esNext: result.tsScript,
                            sourceMap: result.sourceMap
                        };
                        isError = true;
                        const actionResult = yield codenowUtils_5.CodeNowUtils.doAction(Object.assign(Object.assign({}, data), { cmd: codenowUtils_5.CodeNowActionTypes.update_si }));
                        showMessage('Saved successfully', 'info');
                        if (codenowUtils_5.CodeNowUtils.isSuccessful(actionResult)) {
                            dirtyCount = 0;
                            yield monacoInstance.modifyDebugPoints();
                        }
                        else
                            throw new Error(JSON.stringify(actionResult));
                    }
                    catch (e) {
                        if (isError) {
                            openBootstrapModal($el, $waitEl, jQuery('#fail_modal'));
                        }
                        else {
                            showMessage(e.toString(), 'error');
                        }
                    }
                    finally {
                        $el.removeAttr('disabled');
                        $waitEl.addClass('hide');
                    }
                    return false;
                });
            },
            toggleLinter: function () {
                tsCompilerOptions_2.default.linter = !tsCompilerOptions_2.default.linter;
                monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: tsCompilerOptions_2.default.linter,
                    noSyntaxValidation: tsCompilerOptions_2.default.linter,
                });
                updateCompiler();
            },
            updateAllSIDeclaration: function (el, flushOld = false) {
                var $el = jQuery(el);
                var $waitEl = $el.find('>i');
                $el.attr('disabled', 'disabled');
                $waitEl.removeClass('hide');
                let path = '';
                if (flushOld)
                    path = "/api/now/table/sys_script_include?&sysparm_query=active=true";
                else
                    path = '/api/now/typescript_helpers/getOutOfSyncSI';
                if (!siDeclEmittor.isServiceNow())
                    path = '/metadata/sys_script_include.json';
                function updateServer(jsonResult) {
                    if (jsonResult.length == 0) {
                        openBootstrapModal($el, $waitEl, jQuery('#success_modal'));
                        return;
                    }
                    if (!siDeclEmittor.isServiceNow())
                        return;
                    let updateOptions = {
                        url: '/api/now/typescript_helpers/updateMultiSIDecl',
                        type: 'POST',
                        data: jsonResult,
                        headers: {
                            'X-UserToken': window.g_ck
                        },
                        contentType: 'application/json',
                        success: function (data) {
                            console.log(data);
                        }
                    };
                    if (flushOld) {
                        updateOptions.url = '/api/now/table/ts_definition/b4c6d3500ba213008e64aabcb4673a6c';
                        updateOptions.type = 'put';
                        updateOptions.data = JSON.stringify({ json_value: jsonResult });
                    }
                    jQuery.ajax(updateOptions).done((data) => {
                        openBootstrapModal($el, $waitEl, jQuery('#success_modal'));
                        console.log(data);
                    }).fail(() => {
                        openBootstrapModal($el, $waitEl, jQuery('#fail_modal'));
                    });
                }
                const siFetcher = new siDeclEmittor.RecordFetcher(path);
                siFetcher.fetch().then((resp) => {
                    const $updateSI = jQuery('#UpdateSI');
                    if (resp.length == 0) {
                        openBootstrapModal($el, $waitEl, jQuery('#success_modal'));
                        $updateSI.text("Update Scripts");
                        return;
                    }
                    window.onSIParserProgressEvent = function (msg) {
                        $updateSI.text("Updating ... " + msg.percentage + ' %');
                    };
                    siDeclEmittor.generateTypeDeclarations(resp).then((result) => {
                        var jsonResult = JSON.stringify({ api: result.formatterResult });
                        updateServer(jsonResult);
                        console.log('type checker parser results came ');
                        if (result.errors && result.errors.length > 0) {
                            result.errors.forEach(val => {
                                console.log('parsing error ' + val);
                            });
                        }
                        $updateSI.text("Update Scripts");
                    }, (errorMsg) => {
                        $el.removeAttr('disabled');
                        $updateSI.text("Try again");
                    });
                    console.log('parsing done');
                }, (err) => {
                    alert("unable to fetch the script include with error " + err);
                });
            },
            updateTableDeclarations(el) {
                return __awaiter(this, void 0, void 0, function* () {
                    var $el = jQuery(el);
                    var $waitEl = $el.find('>i');
                    $el.attr('disabled', 'disabled');
                    $waitEl.removeClass('hide');
                    try {
                        const actionResult = yield codenowUtils_5.CodeNowUtils.doAction({ cmd: codenowUtils_5.CodeNowActionTypes.update_table_schema });
                        if (!codenowUtils_5.CodeNowUtils.isSuccessful(actionResult))
                            new Error(JSON.stringify(actionResult));
                        openBootstrapModal($el, $waitEl, jQuery('#success_modal'));
                    }
                    catch (e) {
                        openBootstrapModal($el, $waitEl, jQuery('#fail_modal'));
                    }
                });
            },
            openNewWindow() {
                window.open(location.href);
            },
            updateOnSave() {
                if (typeof g_form !== 'undefined') {
                    if (g_form.getActionName() === 'none')
                        return false;
                }
                if (siDeclEmittor.isTranspiledScript()) {
                    if (typeof g_form !== 'undefined')
                        g_form.addErrorMessage('With ES6, save is not possible use "CMD + s" keyboard short cut', "error_message_es6_save");
                    return false;
                }
                return updateTypedeclarations(false, true, true, function () {
                    let recordConfig = window.recordConfig;
                    if (recordConfig.isNewRecord)
                        gsftSubmit(undefined, undefined, "sysverb_insert");
                    else
                        gsftSubmit(undefined, undefined, g_form.getActionName());
                }, function () {
                });
            },
            updateDecl(el, jsDoc) {
                const $el = jQuery(el);
                const $waitEl = $el.find('>i');
                $el.attr('disabled', 'disabled');
                $waitEl.removeClass('hide');
                return updateTypedeclarations(jsDoc, true, false, () => {
                    openBootstrapModal($el, $waitEl, jQuery('#success_modal'));
                }, function () {
                    openBootstrapModal($el, $waitEl, jQuery('#fail_modal'));
                });
            },
            onCompilerSettingsChange(el) {
                const li = el.closest("li");
                const key = li.dataset["key"];
                if (!key)
                    return;
                compilerOptions[key] = !compilerOptions[key];
                if (compilerOptions[key])
                    jQuery(li).find(".state-icon").removeClass('glyphicon-unchecked').addClass('glyphicon-check');
                else
                    jQuery(li).find(".state-icon").removeClass('glyphicon-check').addClass('glyphicon-unchecked');
                updateCompiler();
            },
            onModuleChange(key, value) {
                compilerOptions.module = parseInt(value);
                updateCompiler();
            },
            onTargetChange(key, value) {
                const val = parseInt(value);
                compilerOptions.target = val;
                updateCompiler();
            },
            onJSXFactoryChange(key, value) {
                if (!siDeclEmittor.isSeismicComponent())
                    return;
                compilerOptions.jsxFactory = value.trim();
                const vfsCompilerOptions = amdBundler_1.default.getCompilerOptions();
                vfsCompilerOptions.jsxFactory = value.trim();
                amdBundler_1.default.setCompilerOptions(vfsCompilerOptions);
                //updateCompiler();
            },
            onJSXChange(key, value) {
                const val = parseInt(value);
                compilerOptions.jsx = val;
                //siDeclEmittor.loadJSXIntellisense();
                return updateCompiler();
            },
            onAddTab() {
                monacoInstance.addFile();
            },
            onRemoveTab(name) {
                monacoInstance.removeFile(name);
                console.log(`${name} removed`);
            },
            onSelectTab(name) {
                monacoInstance.selectFile(name);
            },
            initialize() {
                MyInit();
            }
        };
        return codeNowSettings;
    }
    exports.initMainEditor = initMainEditor;
    if (siDeclEmittor.isMainThread() && window.recordConfig)
        window['settings'] = initMainEditor();
});
define("vfsExample", ["require", "exports", "vfs"], function (require, exports, vfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    vfs = __importStar(vfs);
    class Point {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        length() {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        }
    }
    class Point3D extends Point {
        constructor(x = 0, y = 0, z = 0) {
            super(x, y);
            this.z = z;
        }
        length() {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
        }
    }
    class MyMath {
        static random() {
            return Math.random();
        }
    }
    const dirName = 'ylnlib';
    let pointStr = `export ${Point.toString()}`;
    let point3DStr = `import { Point } from './Point';
${Point3D.toString()}
`;
    let myMathStr = `export ${MyMath.toString()}`;
    let indexStr = `export { MyMath } from './${dirName}/MyMath';
export { Point } from './${dirName}/Point';
export { Point3D } from './${dirName}/Point3D';`;
    const outFile = `./out/${dirName}.js`;
    function sampleVFS() {
        return __awaiter(this, void 0, void 0, function* () {
            const compilerOptions = {
                /* Basic Options */
                // "incremental": true,                   /* Enable incremental compilation */
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.System,
                // "lib": [],                             /* Specify library files to be included in the compilation. */
                "allowJs": true,
                // "checkJs": true,                       /* Report errors in .js files. */
                // "jsx": "preserve",                     /* Specify JSX code generation: 'preserve', 'react-native', or 'react'. */
                "declaration": true,
                //"declarationMap": true,                /* Generates a sourcemap for each corresponding '.d.ts' file. */
                "sourceMap": true,
                "outFile": outFile,
                // "rootDir": "./",                       /* Specify the root directory of input files. Use to control the output directory structure with --outDir. */
                //"composite": true,                     /* Enable project compilation */
                // "tsBuildInfoFile": "./",               /* Specify file to store incremental compilation information */
                // "removeComments": true,                /* Do not emit comments to output. */
                // "noEmit": true,                        /* Do not emit outputs. */
                // "importHelpers": true,                 /* Import emit helpers from 'tslib'. */
                // "downlevelIteration": true,            /* Provide full support for iterables in 'for-of', spread, and destructuring when targeting 'ES5' or 'ES3'. */
                // "isolatedModules": true,               /* Transpile each file as a separate module (similar to 'ts.transpileModule'). */
                /* Strict Type-Checking Options */
                // "strict": true,                           /* Enable all strict type-checking options. */
                // "noImplicitAny": true,                 /* Raise error on expressions and declarations with an implied 'any' type. */
                // "strictNullChecks": true,              /* Enable strict null checks. */
                // "strictFunctionTypes": true,           /* Enable strict checking of function types. */
                // "strictBindCallApply": true,           /* Enable strict 'bind', 'call', and 'apply' methods on functions. */
                // "strictPropertyInitialization": true,  /* Enable strict checking of property initialization in classes. */
                // "noImplicitThis": true,                /* Raise error on 'this' expressions with an implied 'any' type. */
                // "alwaysStrict": true,                  /* Parse in strict mode and emit "use strict" for each source file. */
                /* Additional Checks */
                // "noUnusedLocals": true,                /* Report errors on unused locals. */
                // "noUnusedParameters": true,            /* Report errors on unused parameters. */
                // "noImplicitReturns": true,             /* Report error when not all code paths in function return a value. */
                // "noFallthroughCasesInSwitch": true,    /* Report errors for fallthrough cases in switch statement. */
                /* Module Resolution Options */
                // "moduleResolution": "node",            /* Specify module resolution strategy: 'node' (Node.js) or 'classic' (TypeScript pre-1.6). */
                // "baseUrl": "./",                       /* Base directory to resolve non-absolute module names. */
                // "paths": {},                           /* A series of entries which re-map imports to lookup locations relative to the 'baseUrl'. */
                // "rootDirs": [],                        /* List of root folders whose combined content represents the structure of the project at runtime. */
                // "typeRoots": [],                       /* List of folders to include type definitions from. */
                // "types": [],                           /* Type declaration files to be included in compilation. */
                // "allowSyntheticDefaultImports": true,  /* Allow default imports from modules with no default export. This does not affect code emit, just typechecking. */
                "esModuleInterop": true,
            };
            const fsMap = yield vfs.createDefaultMapFromCDN(compilerOptions, ts.version, true, ts, undefined);
            fsMap.set(`${dirName}/Point.ts`, pointStr);
            fsMap.set(`${dirName}/Point3D.ts`, point3DStr);
            fsMap.set(`${dirName}/MyMath.js`, myMathStr);
            fsMap.set(`${dirName}.ts`, indexStr);
            const system = vfs.createSystem(fsMap);
            const env = vfs.createVirtualTypeScriptEnvironment(system, [...fsMap.keys()], ts, compilerOptions);
            const program = env.languageService.getProgram();
            let result = program.emit();
            console.log(JSON.stringify(result));
            const content = fsMap.get(outFile);
            let outContent = env.sys.readFile(`${dirName}.js`);
            console.log(outContent);
            let content1 = system.readFile(outFile, 'utf8');
            console.log(content + ' ' + content1);
        });
    }
    function sample2() {
        return __awaiter(this, void 0, void 0, function* () {
            const fsMap = yield vfs.createDefaultMapFromCDN({}, ts.version, true, ts, undefined);
            fsMap.set(`${dirName}/Point.ts`, pointStr);
            fsMap.set(`${dirName}/Point3D.ts`, point3DStr);
            fsMap.set(`${dirName}/MyMath.js`, myMathStr);
            fsMap.set(`${dirName}.ts`, indexStr);
            const compilerOptions = {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.System,
                allowJs: true,
                sourceMap: true,
                inlineSourceMap: true,
                inlineSources: true,
                outFile: `${dirName}.js`
            };
            const system = vfs.createSystem(fsMap);
            const host = vfs.createVirtualCompilerHost(system, {}, ts);
            const program = ts.createProgram({
                rootNames: [...fsMap.keys()],
                options: compilerOptions,
                host: host.compilerHost,
            });
            //const sourceFile = program.getSourceFile('index.ts');
            //sourceFile.update("", {newLength: 10, span: ts.createTextSpan()})
            // This will update the fsMap with new files
            // for the .d.ts and .js files
            const result = program.emit();
            console.log(result);
        });
    }
    function languageServiceHost() {
        return __awaiter(this, void 0, void 0, function* () {
            const fsMap = yield vfs.createDefaultMapFromCDN({}, ts.version, true, ts, undefined);
            fsMap.set(`${dirName}/Point.ts`, pointStr);
            fsMap.set(`${dirName}/Point3D.ts`, point3DStr);
            fsMap.set(`${dirName}/MyMath.js`, myMathStr);
            fsMap.set(`${dirName}.ts`, indexStr);
            const compilerOptions = {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.System,
                allowJs: true,
                sourceMap: true,
                inlineSourceMap: true,
                inlineSources: true,
                outFile: `${dirName}.js`
            };
            const system = vfs.createSystem(fsMap);
            const lsR = vfs.createVirtualLanguageServiceHost(system, [...fsMap.keys()], compilerOptions, ts);
            const program = ts.createProgram({
                rootNames: [...fsMap.keys()],
                options: compilerOptions,
                host: lsR.languageServiceHost
            });
            const result = program.emit();
            console.log(result);
        });
    }
    function setupSampleVFS() {
        if (typeof window === 'undefined')
            return setTimeout(setupSampleVFS, 1000);
        window['vfs'] = {
            sampel1: sampleVFS,
            sample2,
            languageServiceHost
        };
    }
    setupSampleVFS();
    function boot() {
        function createScript(src, content, callback) {
            var el = document.createElement('script');
            el.onload = () => {
                if (callback)
                    callback();
            };
            if (typeof src === 'string') {
                el.type = 'text/javascript';
                el.src = src;
            }
            else {
                el.type = "systemjs-importmap";
                el.text = content;
            }
            document.head.appendChild(el);
        }
        createScript(undefined, JSON.stringify({
            "imports": {
                "ylnlib": "./api/now/system_js_helpers/ylnlib"
            }
        }), undefined);
        createScript('https://cdn.jsdelivr.net/npm/systemjs/dist/system.js', undefined, () => {
            createScript('https://cdn.jsdelivr.net/npm/systemjs@6.3.1/dist/extras/named-register.js', undefined, () => {
                /// @ts-ignore
                System.import('ylnlib');
            });
        });
    }
});
