// Mocked 'path' module for browser environments
// Used by Turbopack resolveAlias to prevent bundling Node's 'path' module
// Must be robust enough for Next.js SSR metadata resolution

function join() {
    var args = Array.prototype.slice.call(arguments);
    return args.filter(Boolean).join('/').replace(/\/+/g, '/');
}

function resolve() {
    var args = Array.prototype.slice.call(arguments);
    return args.filter(Boolean).join('/').replace(/\/+/g, '/');
}

function dirname(p) {
    if (!p) return '.';
    var parts = String(p).split('/');
    parts.pop();
    return parts.join('/') || '.';
}

function basename(p, ext) {
    if (!p) return '';
    var base = String(p).split('/').pop() || '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
}

function extname(p) {
    if (!p) return '';
    var base = String(p).split('/').pop() || '';
    var dot = base.lastIndexOf('.');
    return dot > 0 ? base.slice(dot) : '';
}

function normalize(p) {
    return p || '';
}

function isAbsolute(p) {
    return p && (p.charAt(0) === '/' || /^[A-Za-z]:/.test(p));
}

function relative(from, to) {
    return to || '';
}

function parse(p) {
    p = p || '';
    var ext = extname(p);
    var base = basename(p);
    return {
        root: isAbsolute(p) ? '/' : '',
        dir: dirname(p),
        base: base,
        ext: ext,
        name: ext ? base.slice(0, -ext.length) : base
    };
}

function format(obj) {
    if (!obj) return '';
    return obj.dir ? obj.dir + '/' + obj.base : obj.base || '';
}

var path = {
    resolve: resolve,
    join: join,
    dirname: dirname,
    basename: basename,
    extname: extname,
    sep: '/',
    delimiter: ':',
    parse: parse,
    format: format,
    isAbsolute: isAbsolute,
    normalize: normalize,
    relative: relative,
    posix: null,
    win32: null
};

// Set posix to self-reference
path.posix = path;
path.win32 = path;

module.exports = path;
module.exports.default = path;
module.exports.join = join;
module.exports.resolve = resolve;
module.exports.dirname = dirname;
module.exports.basename = basename;
module.exports.extname = extname;
module.exports.parse = parse;
module.exports.format = format;
module.exports.normalize = normalize;
module.exports.isAbsolute = isAbsolute;
module.exports.relative = relative;
module.exports.sep = '/';
module.exports.delimiter = ':';
module.exports.posix = path;
module.exports.win32 = path;
