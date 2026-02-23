// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MATRIX_PATH = path.join(ROOT, 'scenario_matrix.json');
const CONFIG_PATH = path.join(ROOT, 'backend_seed_config.json');
const OUTPUT_PATH = path.join(ROOT, 'backend_seed_data.json');

const textExtensions = new Set([
    '.py',
    '.r',
    '.js',
    '.rb',
    '.php',
    '.cpp',
    '.java',
    '.hpp',
    '.txt',
    '.md',
    '.json',
    '.ipynb',
    '.yml',
    '.yaml',
    '.toml',
]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const listFilesRecursively = (dirPath) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const absolutePath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursively(absolutePath));
        } else {
            files.push(absolutePath);
        }
    }
    return files;
};

const normalizeRelativePath = (baseDir, filePath) => path.relative(baseDir, filePath).split(path.sep).join('/');

const readFilePayload = (filePath, rootDir) => {
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = normalizeRelativePath(rootDir, filePath);

    if (textExtensions.has(ext)) {
        return {
            name: path.basename(filePath),
            path: path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath),
            relativePath,
            encoding: 'utf-8',
            content: fs.readFileSync(filePath, 'utf8'),
        };
    }

    return {
        name: path.basename(filePath),
        path: path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath),
        relativePath,
        encoding: 'base64',
        content: fs.readFileSync(filePath).toString('base64'),
    };
};

const loadAssignmentTemplateFiles = (languageRoot) => {
    const templateDir = path.join(languageRoot, 'template');
    const templateFiles = listFilesRecursively(templateDir);
    return templateFiles.map((filePath) => readFilePayload(filePath, templateDir));
};

const loadExecutionResourceFiles = (languageRoot) => {
    const resources = [];
    const sharedFile = path.join(languageRoot, 'existing_data.txt');
    if (fs.existsSync(sharedFile)) {
        resources.push(readFilePayload(sharedFile, languageRoot));
    }
    return resources;
};

const mergeFilePayloadsByRelativePath = (files) => {
    const seen = new Set();
    const merged = [];
    files.forEach((file) => {
        if (!seen.has(file.relativePath)) {
            seen.add(file.relativePath);
            merged.push(file);
        }
    });
    return merged;
};

const toAssignmentDataSet = (filePayload) => ({
    name: filePayload.name,
    description: `Seeded execution resource from ${filePayload.relativePath}`,
    mountPath: `shared/${filePayload.name}`,
    encoding: filePayload.encoding,
    content: filePayload.content,
    sourceRelativePath: filePayload.relativePath,
});

const loadCompleteHappyPathSubmission = (languageRoot, language) => {
    const completeDir = path.join(languageRoot, 'complete');
    const files = listFilesRecursively(completeDir).map((filePath) => readFilePayload(filePath, completeDir));
    return {
        key: `${language}_complete_happy_path`,
        scenario: 'complete_happy_path',
        description: 'Completed student submission for the assignment happy path.',
        files,
    };
};

const buildFailureScenarioSubmissions = (scenarioDir, language) => {
    const files = listFilesRecursively(scenarioDir);
    const runtimeFiles = files.filter((filePath) => path.basename(filePath).startsWith('runtime_error.'));

    // Prefer extension-real syntax samples when present, otherwise fallback to .txt sample
    const syntaxCandidates = files.filter((filePath) => path.basename(filePath).startsWith('syntax_error.'));
    const preferredSyntaxFile =
        syntaxCandidates.find((filePath) => !filePath.endsWith('.txt')) || syntaxCandidates[0] || null;

    const submissions = [];

    runtimeFiles.forEach((runtimePath, index) => {
        submissions.push({
            key: `${language}_failure_runtime_${index + 1}`,
            scenario: 'failure_cases',
            kind: 'runtime_error',
            description: 'Intentional runtime error submission.',
            files: [readFilePayload(runtimePath, scenarioDir)],
        });
    });

    if (preferredSyntaxFile) {
        submissions.push({
            key: `${language}_failure_syntax_1`,
            scenario: 'failure_cases',
            kind: 'syntax_error',
            description: 'Intentional syntax error submission.',
            files: [readFilePayload(preferredSyntaxFile, scenarioDir)],
        });
    }

    return submissions;
};

const loadScenarioSubmissions = (languageRoot, language, requiredScenarios) => {
    const scenariosRoot = path.join(languageRoot, 'scenarios');

    const submissions = [];

    requiredScenarios.forEach((scenario) => {
        const scenarioDir = path.join(scenariosRoot, scenario);

        if (scenario === 'failure_cases') {
            submissions.push(...buildFailureScenarioSubmissions(scenarioDir, language));
            return;
        }

        const files = listFilesRecursively(scenarioDir).map((filePath) => readFilePayload(filePath, scenarioDir));
        submissions.push({
            key: `${language}_${scenario}`,
            scenario,
            description: `Scenario submission for ${language}/${scenario}`,
            files,
        });
    });

    return submissions;
};

const toDisplayName = (language) => {
    const names = {
        cpp: 'C++',
        java: 'Java',
        node: 'Node',
        php: 'PHP',
        python: 'Python',
        r: 'R',
        ruby: 'Ruby',
    };
    return names[language] || language;
};

const buildSeedData = () => {
    const matrix = readJson(MATRIX_PATH);
    const config = readJson(CONFIG_PATH);

    const assignments = matrix.languages.map((language) => {
        const languageRoot = path.join(ROOT, language);
        const assignmentTemplateFiles = loadAssignmentTemplateFiles(languageRoot);
        const executionResourceFiles = loadExecutionResourceFiles(languageRoot);
        const assignmentFiles = mergeFilePayloadsByRelativePath([...assignmentTemplateFiles, ...executionResourceFiles]);
        const assignmentDataSets = executionResourceFiles.map(toAssignmentDataSet);

        const scenarioSubmissions = loadScenarioSubmissions(languageRoot, language, matrix.requiredScenarios);
        const fakeSubmissions = config.includeCompleteAsHappyPath
            ? [...scenarioSubmissions, loadCompleteHappyPathSubmission(languageRoot, language)]
            : scenarioSubmissions;

        return {
            key: language,
            assignmentName: `${toDisplayName(language)} ${config.assignmentNameSuffix}`,
            courseId: config.defaultCourseId,
            environmentLanguage: config.languageEnvironmentMap[language] || language,
            assignmentFiles,
            assignmentDataSets,
            fakeSubmissions,
        };
    });

    return {
        metadata: {
            generatedAt: new Date().toISOString(),
            source: 'src/__tests__/test_submission/build_backend_seed_data.js',
            scenarioMatrixVersion: matrix.version,
        },
        assignments,
    };
};

const writeSeedData = () => {
    const payload = buildSeedData();
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`Wrote backend seed data: ${OUTPUT_PATH}`);
    console.log(`Assignments: ${payload.assignments.length}`);
};

if (require.main === module) {
    writeSeedData();
}

module.exports = { buildSeedData, writeSeedData };
