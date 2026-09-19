"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectInitializer = void 0;
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
var ProjectInitializer;
(function (ProjectInitializer) {
    ProjectInitializer.PROJECT_INITIALIZER_FULL_NAME = 'Project Initializer by Red Hat';
    ProjectInitializer.PROJECT_INITIALIZER_NAME = 'Project Initializer';
    ProjectInitializer.CAMEL_FUSE_RUNTIME_IDS = ['camel', 'fuse'];
    ProjectInitializer.BUILDER_CATALOG_URL = 'https://forge.api.openshift.io/api/';
    class PaletteOptionsGeneral {
    }
    PaletteOptionsGeneral.camel = "a Camel/Fuse";
    PaletteOptionsGeneral.go = "a Go";
    PaletteOptionsGeneral.vertx = "an Eclipse Vert.x";
    PaletteOptionsGeneral.thorntail = "a Thorntail";
    PaletteOptionsGeneral.spring = "a Spring Boot";
    PaletteOptionsGeneral.nodejs = "a NodeJS";
    ProjectInitializer.PaletteOptionsGeneral = PaletteOptionsGeneral;
    const EXT_STRING_SUFFIX = " project using " + ProjectInitializer.PROJECT_INITIALIZER_NAME;
    const EXT_STRING_PREFIX = "Project: Generate ";
    ProjectInitializer.PI_GENERAL = {
        general: EXT_STRING_PREFIX + "a" + EXT_STRING_SUFFIX,
        camel: EXT_STRING_PREFIX + PaletteOptionsGeneral.camel + EXT_STRING_SUFFIX,
        go: EXT_STRING_PREFIX + PaletteOptionsGeneral.go + EXT_STRING_SUFFIX,
        nodejs: EXT_STRING_PREFIX + PaletteOptionsGeneral.nodejs + EXT_STRING_SUFFIX,
        spring: EXT_STRING_PREFIX + PaletteOptionsGeneral.spring + EXT_STRING_SUFFIX,
        thorntail: EXT_STRING_PREFIX + PaletteOptionsGeneral.thorntail + EXT_STRING_SUFFIX,
        vertx: EXT_STRING_PREFIX + PaletteOptionsGeneral.vertx + EXT_STRING_SUFFIX
    };
    ProjectInitializer.FIRST_LEVEL_OPTIONS = [
        ProjectInitializer.PI_GENERAL.general,
        ProjectInitializer.PI_GENERAL.camel,
        ProjectInitializer.PI_GENERAL.go,
        ProjectInitializer.PI_GENERAL.nodejs,
        ProjectInitializer.PI_GENERAL.spring,
        ProjectInitializer.PI_GENERAL.thorntail,
        ProjectInitializer.PI_GENERAL.vertx
    ];
})(ProjectInitializer = exports.ProjectInitializer || (exports.ProjectInitializer = {}));
//# sourceMappingURL=projectInitializerConstants.js.map