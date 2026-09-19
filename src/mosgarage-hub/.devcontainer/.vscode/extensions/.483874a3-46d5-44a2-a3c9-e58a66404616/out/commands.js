"use strict";
/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPrOrMr = exports.openMergeRequests = exports.copyFilePermalink = exports.openFilePermalink = exports.openFileBlame = exports.openFileHistory = exports.openFile = exports.openReleases = exports.openSettings = exports.openWiki = exports.openProjects = exports.openActions = exports.openPullRequests = exports.openIssues = exports.openProject = void 0;
const url_1 = require("./url");
/* COMMANDS */
function openProject() {
    return url_1.default.open();
}
exports.openProject = openProject;
function openIssues() {
    return url_1.default.open(false, false, 'issues');
}
exports.openIssues = openIssues;
function openPullRequests() {
    return url_1.default.open(false, false, 'pulls');
}
exports.openPullRequests = openPullRequests;
function openMergeRequests() {
    return url_1.default.open(false, false, 'merge_requests');
}
exports.openMergeRequests = openMergeRequests;
function openPrOrMr() {
    return url_1.default.open(false, false, ['pulls', 'merge_requests']);
}
exports.openPrOrMr = openPrOrMr;
function openActions() {
    return url_1.default.open(false, false, 'actions');
}
exports.openActions = openActions;
function openProjects() {
    return url_1.default.open(false, false, 'projects');
}
exports.openProjects = openProjects;
function openWiki() {
    return url_1.default.open(false, false, 'wiki');
}
exports.openWiki = openWiki;
function openSettings() {
    return url_1.default.open(false, false, 'settings');
}
exports.openSettings = openSettings;
function openReleases() {
    return url_1.default.open(false, false, 'releases');
}
exports.openReleases = openReleases;
function openFile() {
    return url_1.default.open(true, false, 'blob');
}
exports.openFile = openFile;
function openFileHistory() {
    return url_1.default.open(true, false, 'commits');
}
exports.openFileHistory = openFileHistory;
function openFileBlame() {
    return url_1.default.open(true, false, 'blame');
}
exports.openFileBlame = openFileBlame;
function openFilePermalink() {
    return url_1.default.open(true, true, 'blob');
}
exports.openFilePermalink = openFilePermalink;
function copyFilePermalink() {
    return url_1.default.copy(true, true, 'blob');
}
exports.copyFilePermalink = copyFilePermalink;
//# sourceMappingURL=commands.js.map