"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndentAt = getIndentAt;
exports.getIndent = getIndent;
exports.indent = indent;
exports.indentText = indentText;
function getIndentAt(document, position) {
    const line = document.lineAt(position.line);
    const indent = line.firstNonWhitespaceCharacterIndex;
    const char = line.text.charAt(0);
    if (line.text.substring(line.firstNonWhitespaceCharacterIndex).startsWith("- ")) {
        // increase indent by two for array items
        return { indent: indent + 2, char };
    }
    return { indent, char };
}
function getIndent(document) {
    // scan first 100 or less lines of the document
    const maxLines = document.lineCount > 100 ? 100 : document.lineCount;
    for (let lineNumber = 0; lineNumber++; lineNumber < maxLines) {
        const line = document.lineAt(lineNumber);
        const indent = line.firstNonWhitespaceCharacterIndex;
        // check for indenteted line which does not contain only whitespace
        if (indent > 0 && indent !== line.text.length) {
            const char = line.text.charAt(0);
            return { indent, char };
        }
    }
    // return default indent
    return { indent: 2, char: " " };
}
function indent(document, target, text) {
    const documentIndent = getIndent(document);
    const targetIndent = getIndentAt(document, target);
    const reindented = indentText(text, documentIndent.indent, targetIndent.indent, documentIndent.char);
    return reindented;
}
function indentText(text, documentIndent, targetIndent, indentChar) {
    // this function takes multiline text indented with one space for each level of identation
    // first replace each space located at the start of each string
    // with X characters per document indent, resulting in text
    // indented according to the document indent
    const textWithDocumentIndent = text.replace(SPACES_AT_THE_START_MULTILINE, (match) => indentChar.repeat(documentIndent * match.length));
    // now prepend X indent chars to the beginning of each string
    // resulting in a text indented to the target indentation level
    const textAtTargetIndent = textWithDocumentIndent.replace(START_OF_THE_STRING, indentChar.repeat(targetIndent));
    return textAtTargetIndent;
}
const SPACES_AT_THE_START_MULTILINE = new RegExp("^\\s+", "mg");
const START_OF_THE_STRING = new RegExp("^", "mg");
//# sourceMappingURL=indent.js.map