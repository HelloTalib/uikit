import { glob } from 'glob';
import inquirer from 'inquirer';
import { args, read, replaceInFile, validClassName } from './util.js';

if (args.h || args.help) {
    console.log(`
        usage:

        prefix.js [-p{refix}=prefix] [-s{ource}=folder to replace prefix in]

        example:

        prefix.js // will prompt for a prefix to replace the current one with
        prefix.js -p=xyz // will replace any existing prefix with xyz

    `);
    process.exit(0);
}

const path = args.s || args.source || 'dist';
const currentPrefix = await findExistingPrefix();
const prefix = await getPrefix();

if (currentPrefix === prefix) {
    throw new Error(`already prefixed with: ${prefix}`);
}

await replacePrefix(currentPrefix, prefix);

async function findExistingPrefix() {
    return (await read(`${path}/css/uikit.css`)).match(
        new RegExp(`(${validClassName.source})(-[a-z]+)?-grid`),
    )?.[1];
}

async function getPrefix() {
    const prefixFromInput = args.p || args.prefix;

    if (!prefixFromInput) {
        const prompt = inquirer.createPromptModule();

       return (
           await prompt({
               name: 'prefix',
               message: 'enter a prefix',
               validate: (val, res) => {
                   // Ensure res is an object
                   res = res || {};

                   // Validate the prefix and set it if valid
                   if (val.length && val.match(validClassName)) {
                       res.prefix = val;
                       return true;
                   } else {
                       return 'invalid prefix';
                   }
               },
           })
       ).prefix;
    }

    if (validClassName.test(prefixFromInput)) {
        return prefixFromInput;
    } else {
        throw `Illegal prefix: ${prefixFromInput}`;
    }
}

async function replacePrefix(from, to) {
    for (const file of await glob(`${path}/**/*.css`)) {
        await replaceInFile(file, (data) =>
            data.replace(new RegExp(`${from}-([a-z\\d-]+)`, 'g'), `${to}-$1`),
        );
    }

    for (const file of await glob(`${path}/**/*.js`)) {
        await replaceInFile(file, (data) =>
            data
                .replace(new RegExp(`${from}-`, 'g'), `${to}-`)
                .replace(new RegExp(`(${from})?UIkit`, 'g'), `${to === 'uk' ? '' : to}UIkit`),
        );
    }
}
