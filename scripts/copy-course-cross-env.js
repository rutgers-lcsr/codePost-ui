#!/usr/bin/env node

/**
 * Copy assignments from a source course in one environment to a destination course
 * in another environment. Useful for putting a course from local development into staging or production.
 *
 * This script recreates assignments, rubric categories/comments, and test categories/cases.
 * It does NOT copy submissions.
 *
 * Required env vars:
 *   SOURCE_BASE_URL      e.g. http://localhost:8000/
 *   SOURCE_COURSE_ID     e.g. 53
 *   DEST_BASE_URL        e.g. https://dev-codepost-2.cs.rutgers.edu/
 *
 * Destination course selection:
 *   DEST_COURSE_ID       (optional) If provided, copy into this existing course.
 *   If omitted, a new destination course is created from the source course settings.
 *
 * Auth (source):
 *   SOURCE_TOKEN
 *
 * Auth (destination):
 *   DEST_TOKEN
 *
 * Optional env vars:
 *   DEST_COURSE_NAME_SUFFIX   default: " (copied)"
 *
 * Optional flags:
 *   --dry-run
 *   --only="Assignment A,Assignment B"
 *   --allow-duplicates
 *   --non-interactive
 */

const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

const args = process.argv.slice(2);
const dryRunFromFlag = args.includes('--dry-run');
const allowDuplicatesFromFlag = args.includes('--allow-duplicates');
const forceNonInteractive = args.includes('--non-interactive');
const onlyArg = args.find((arg) => arg.startsWith('--only='));
const onlyNamesFromFlag = onlyArg
    ? new Set(
        onlyArg
            .replace('--only=', '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    )
    : null;

const fail = (message) => {
    console.error(`\n❌ ${message}`);
    process.exit(1);
};

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const buildBaseUrlCandidates = (baseUrl) => {
    const normalized = normalizeBaseUrl(baseUrl);
    const candidates = [normalized];

    if (normalized.endsWith('/api')) {
        candidates.push(normalized.slice(0, -4));
    } else {
        candidates.push(`${normalized}/api`);
    }

    return [...new Set(candidates.filter(Boolean))];
};

const parseBoolean = (value, defaultValue) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    return normalized === 'y' || normalized === 'yes' || normalized === 'true' || normalized === '1';
};

const promptWithDefault = async (rl, label, defaultValue) => {
    const shownDefault = defaultValue === undefined || defaultValue === null || defaultValue === '' ? '' : ` [${defaultValue}]`;
    const answer = await rl.question(`${label}${shownDefault}: `);
    if (answer.trim().length === 0) {
        return defaultValue ?? '';
    }
    return answer.trim();
};

const promptBoolean = async (rl, label, defaultValue) => {
    const suffix = defaultValue ? ' [Y/n]' : ' [y/N]';
    const answer = await rl.question(`${label}${suffix}: `);
    return parseBoolean(answer, defaultValue);
};

const parseInteger = (value, label) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
        fail(`${label} must be an integer.`);
    }
    return parsed;
};

const buildAuthHeader = ({ token }, prefix) => {
    const safeToken = token?.trim();

    if (safeToken) {
        if (safeToken.startsWith('Token ') || safeToken.startsWith('Bearer ')) {
            return safeToken;
        }
        return `Token ${safeToken}`;
    }

    fail(`Provide ${prefix}_TOKEN.`);
};

const buildAuthFromEnv = (prefix) => ({
    token: process.env[`${prefix}_TOKEN`] || '',
});

const hasAuth = (auth) => Boolean(auth.token?.trim());

const promptForAuth = async (rl, prefix, existingAuth) => {
    if (hasAuth(existingAuth)) {
        const useExisting = await promptBoolean(rl, `${prefix}: use auth from environment?`, true);
        if (useExisting) {
            return existingAuth;
        }
    }

    const token = await promptWithDefault(rl, `${prefix} token`, existingAuth.token || '');
    return { token };
};

const isInteractiveSession = !forceNonInteractive && Boolean(stdin.isTTY && stdout.isTTY);

const getConfig = async () => {
    if (!isInteractiveSession) {
        const requiredEnv = ['SOURCE_BASE_URL', 'SOURCE_COURSE_ID', 'DEST_BASE_URL'];
        const missing = requiredEnv.filter((k) => !process.env[k]);
        if (missing.length) {
            fail(`Missing required environment variables: ${missing.join(', ')}`);
        }

        const sourceCourseId = parseInteger(process.env.SOURCE_COURSE_ID, 'SOURCE_COURSE_ID');
        const destCourseIdRaw = process.env.DEST_COURSE_ID;
        if (destCourseIdRaw && !Number.isInteger(Number(destCourseIdRaw))) {
            fail('DEST_COURSE_ID must be an integer when provided.');
        }

        return {
            sourceBaseUrl: normalizeBaseUrl(process.env.SOURCE_BASE_URL),
            sourceCourseId,
            sourceAuth: buildAuthFromEnv('SOURCE'),
            destBaseUrl: normalizeBaseUrl(process.env.DEST_BASE_URL),
            destCourseId: destCourseIdRaw ? Number(destCourseIdRaw) : null,
            destAuth: buildAuthFromEnv('DEST'),
            destCourseNameSuffix: process.env.DEST_COURSE_NAME_SUFFIX || ' (copied)',
            dryRun: dryRunFromFlag,
            allowDuplicates: allowDuplicatesFromFlag,
            onlyNames: onlyNamesFromFlag,
        };
    }

    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
        console.log('🧭 Interactive mode: answer prompts (Enter accepts defaults).\n');

        const sourceBaseUrl = normalizeBaseUrl(
            await promptWithDefault(rl, 'Source base URL', process.env.SOURCE_BASE_URL || 'http://localhost:8000/'),
        );
        const sourceCourseId = parseInteger(
            await promptWithDefault(rl, 'Source course ID', process.env.SOURCE_COURSE_ID || ''),
            'SOURCE_COURSE_ID',
        );
        const sourceAuth = await promptForAuth(rl, 'Source auth', buildAuthFromEnv('SOURCE'));

        const destBaseUrl = normalizeBaseUrl(
            await promptWithDefault(
                rl,
                'Destination base URL',
                process.env.DEST_BASE_URL || 'https://dev-codepost-2.cs.rutgers.edu/',
            ),
        );
        const destAuth = await promptForAuth(rl, 'Destination auth', buildAuthFromEnv('DEST'));

        const useExistingDestCourse = await promptBoolean(
            rl,
            'Copy into an existing destination course?',
            Boolean(process.env.DEST_COURSE_ID),
        );

        let destCourseId = null;
        if (useExistingDestCourse) {
            destCourseId = parseInteger(
                await promptWithDefault(rl, 'Destination course ID', process.env.DEST_COURSE_ID || ''),
                'DEST_COURSE_ID',
            );
        }

        const destCourseNameSuffix = await promptWithDefault(
            rl,
            'Destination course name suffix (used only when creating a new destination course)',
            process.env.DEST_COURSE_NAME_SUFFIX || ' (copied)',
        );

        const dryRun = dryRunFromFlag || (await promptBoolean(rl, 'Dry run?', true));
        const allowDuplicates = allowDuplicatesFromFlag || (await promptBoolean(rl, 'Allow duplicate assignment names?', false));

        let onlyNames = onlyNamesFromFlag;
        if (!onlyNamesFromFlag) {
            const onlyInput = await promptWithDefault(
                rl,
                'Only copy specific assignment names? (comma separated, blank = all)',
                '',
            );
            if (onlyInput) {
                onlyNames = new Set(
                    onlyInput
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                );
            }
        }

        return {
            sourceBaseUrl,
            sourceCourseId,
            sourceAuth,
            destBaseUrl,
            destCourseId,
            destAuth,
            destCourseNameSuffix,
            dryRun,
            allowDuplicates,
            onlyNames,
        };
    } finally {
        rl.close();
    }
};

let sourceClient;
let destClient;
let runConfig;

const request = async (client, path, init = {}) => {
    const tryBaseUrls = client.resolvedBaseUrl ? [client.resolvedBaseUrl] : client.baseUrls;
    let lastError = null;

    for (const baseUrl of tryBaseUrls) {
        const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData;
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers: {
                Accept: 'application/json',
                ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
                Authorization: client.authHeader,
                ...(init.headers || {}),
            },
        });

        if (response.ok) {
            client.resolvedBaseUrl = baseUrl;

            if (response.status === 204) return null;

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return response.json();
            }
            return response.text();
        }

        const body = await response.text();
        lastError = new Error(`${response.status} ${response.statusText} on ${baseUrl}${path}\n${body}`);

        // Only try alternate base URL forms when route does not exist and base isn't resolved yet.
        if (!(response.status === 404 && !client.resolvedBaseUrl)) {
            throw lastError;
        }
    }

    throw lastError || new Error(`Request failed for ${path}`);
};

const requestBlob = async (client, path, init = {}) => {
    const tryBaseUrls = client.resolvedBaseUrl ? [client.resolvedBaseUrl] : client.baseUrls;
    let lastError = null;

    for (const baseUrl of tryBaseUrls) {
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers: {
                Authorization: client.authHeader,
                ...(init.headers || {}),
            },
        });

        if (response.ok) {
            client.resolvedBaseUrl = baseUrl;
            return response;
        }

        const body = await response.text();
        lastError = new Error(`${response.status} ${response.statusText} on ${baseUrl}${path}\n${body}`);
        if (!(response.status === 404 && !client.resolvedBaseUrl)) {
            throw lastError;
        }
    }

    throw lastError || new Error(`Request failed for ${path}`);
};

const getCourse = (client, id) => request(client, `/courses/${id}/`);
const getAssignment = (client, id) => request(client, `/assignments/${id}/`);
const getAssignmentFile = (client, id) => request(client, `/assignmentFiles/${id}/`);
const getAssignmentDataSet = (client, id) => request(client, `/assignmentDataSets/${id}/`);
const getRubricCategory = (client, id) => request(client, `/rubricCategories/${id}/`);
const getRubricComment = (client, id) => request(client, `/rubricComments/${id}/`);
const getTestCategory = (client, id) => request(client, `/testCategories/${id}/`);
const getTestCase = (client, id) => request(client, `/testCases/${id}/`);
const getEnvironment = (client, id) => request(client, `/autograder/environments/${id}/`);

const createCourse = (client, payload) => request(client, '/courses/', { method: 'POST', body: JSON.stringify(payload) });
const listCourses = async (client) => {
    const data = await request(client, '/courses/');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
};
const createAssignment = (client, payload) =>
    request(client, '/assignments/', { method: 'POST', body: JSON.stringify(payload) });
const createAssignmentFile = (client, payload) =>
    request(client, '/assignmentFiles/', { method: 'POST', body: JSON.stringify(payload) });
const updateEnvironment = (client, id, payload) =>
    request(client, `/autograder/environments/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
const createEnvironment = (client, payload) =>
    request(client, '/autograder/environments/', { method: 'POST', body: JSON.stringify(payload) });
const createRubricCategory = (client, payload) =>
    request(client, '/rubricCategories/', { method: 'POST', body: JSON.stringify(payload) });
const createRubricComment = (client, payload) =>
    request(client, '/rubricComments/', { method: 'POST', body: JSON.stringify(payload) });
const createTestCategory = (client, payload) =>
    request(client, '/testCategories/', { method: 'POST', body: JSON.stringify(payload) });
const createTestCase = (client, payload) => request(client, '/testCases/', { method: 'POST', body: JSON.stringify(payload) });
const createTestCategoryResource = (client, payload) =>
    request(client, '/testCategoryResources/', { method: 'POST', body: JSON.stringify(payload) });

const pickDefined = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

const createCoursePayloadFromSource = (sourceCourse) => {
    const suffix = runConfig.destCourseNameSuffix || ' (copied)';
    return pickDefined({
        id: -1,
        name: `${sourceCourse.name}${suffix}`,
        period: sourceCourse.period,
        sendReleasedSubmissionsToBack: sourceCourse.sendReleasedSubmissionsToBack,
        showStudentsStatistics: sourceCourse.showStudentsStatistics,
        timezone: sourceCourse.timezone,
        emailNewUsers: sourceCourse.emailNewUsers,
        anonymousGradingDefault: sourceCourse.anonymousGradingDefault,
        allowGradersToEditRubric: sourceCourse.allowGradersToEditRubric,
        minComments: sourceCourse.minComments,
        noUnfinalize: sourceCourse.noUnfinalize,
        lateDayCreditsAllowable: sourceCourse.lateDayCreditsAllowable,
        activateQueue: sourceCourse.activateQueue,
        emailWhitelist: sourceCourse.emailWhitelist,
        inviteCodeEnabled: sourceCourse.inviteCodeEnabled,
        enableStudentFeedbackNotifications: sourceCourse.enableStudentFeedbackNotifications,
        expirationDate: sourceCourse.expirationDate,
        studentsCanSeeGraders: sourceCourse.studentsCanSeeGraders,
        cloneFrom: sourceCourse.id,
        isRubricEditor: false,
        assignments: [],
        sections: [],
    });
};

const ensureUniqueCourseNameForPeriod = async (client, payload) => {
    const existingCourses = await listCourses(client).catch(() => []);
    const hasCollision = (candidateName) =>
        existingCourses.some((c) => c?.name === candidateName && c?.period === payload.period);

    if (!hasCollision(payload.name)) {
        return { payload, renamed: false, originalName: payload.name };
    }

    const baseName = payload.name;
    let counter = 2;
    let candidate = `${baseName} (${counter})`;
    while (hasCollision(candidate)) {
        counter += 1;
        candidate = `${baseName} (${counter})`;
    }

    return {
        payload: { ...payload, name: candidate },
        renamed: true,
        originalName: baseName,
    };
};

const createAssignmentPayloadFromSource = (sourceAssignment, destinationCourseId) => {
    return pickDefined({
        id: -1,
        course: destinationCourseId,
        name: sourceAssignment.name,
        points: sourceAssignment.points,
        isReleased: sourceAssignment.isReleased,
        feedbackReleased: sourceAssignment.feedbackReleased,
        allowStudentUpload: sourceAssignment.allowStudentUpload,
        allowStudentUploadWithPartners: sourceAssignment.allowStudentUploadWithPartners,
        uploadDueDate: sourceAssignment.uploadDueDate,
        maxLateDays: sourceAssignment.maxLateDays,
        liveFeedbackMode: sourceAssignment.liveFeedbackMode,
        allowLateUploads: sourceAssignment.allowLateUploads,
        sortKey: sourceAssignment.sortKey,
        explanation: sourceAssignment.explanation,
        isVisible: sourceAssignment.isVisible,
        hideFrom: sourceAssignment.hideFrom,
        lateDeductions: sourceAssignment.lateDeductions,
        studentsCanSeeGraders: sourceAssignment.studentsCanSeeGraders,
        hideGrades: sourceAssignment.hideGrades,
        anonymousGrading: sourceAssignment.anonymousGrading,
        hideGradersFromStudents: sourceAssignment.hideGradersFromStudents,
        commentFeedback: sourceAssignment.commentFeedback,
        additiveGrading: sourceAssignment.additiveGrading,
        allowRegradeRequests: sourceAssignment.allowRegradeRequests,
        regradeInstructions: sourceAssignment.regradeInstructions,
        regradeDeadline: sourceAssignment.regradeDeadline,
        forcedRubricMode: sourceAssignment.forcedRubricMode,
        templateMode: sourceAssignment.templateMode,
        collaborativeRubricMode: sourceAssignment.collaborativeRubricMode,
        gradersCanEditSubmissions: sourceAssignment.gradersCanEditSubmissions,
        showFrequentlyUsedRubricComments: sourceAssignment.showFrequentlyUsedRubricComments,
        aiSystemPrompt: sourceAssignment.aiSystemPrompt,
        runTestsOnSubmit: sourceAssignment.runTestsOnSubmit,
        testsAffectGrade: sourceAssignment.testsAffectGrade,
        rubricCategories: [],
    });
};

const createAssignmentFilePayload = (sourceFile, destinationAssignmentId) =>
    pickDefined({
        assignment: destinationAssignmentId,
        name: sourceFile.name,
        data: sourceFile.data,
        extension: sourceFile.extension,
        path: sourceFile.path,
        required: sourceFile.required,
        description: sourceFile.description,
        hidden: sourceFile.hidden,
        isTestResource: sourceFile.isTestResource,
    });

const parseFilenameFromContentDisposition = (contentDisposition) => {
    if (!contentDisposition) return null;
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) return decodeURIComponent(utf8Match[1]);
    const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (quotedMatch && quotedMatch[1]) return quotedMatch[1];
    const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
    if (plainMatch && plainMatch[1]) return plainMatch[1].trim();
    return null;
};

const downloadAssignmentDataSetBlob = async (client, datasetId) => {
    const response = await requestBlob(client, `/assignmentDataSets/${datasetId}/download/`, { method: 'GET' });
    const blob = await response.blob();
    const fileNameFromHeader = parseFilenameFromContentDisposition(response.headers.get('content-disposition'));
    return { blob, fileNameFromHeader };
};

const createAssignmentDataSetFromBlob = async (client, payload) => {
    const form = new FormData();
    form.append('assignment', String(payload.assignment));
    form.append('name', payload.name);
    if (payload.description !== undefined && payload.description !== null) form.append('description', payload.description);
    if (payload.mountPath !== undefined && payload.mountPath !== null) form.append('mountPath', payload.mountPath);
    if (payload.isActive !== undefined && payload.isActive !== null) form.append('isActive', String(payload.isActive));
    if (payload.hidden !== undefined && payload.hidden !== null) form.append('hidden', String(payload.hidden));
    if (payload.isTestResource !== undefined && payload.isTestResource !== null)
        form.append('isTestResource', String(payload.isTestResource));
    form.append('file', payload.blob, payload.fileName);

    return request(client, '/assignmentDataSets/', {
        method: 'POST',
        body: form,
    });
};

const createEnvironmentPayload = (sourceEnvironment, destinationAssignmentId) =>
    pickDefined({
        assignment: destinationAssignmentId,
        language: sourceEnvironment.language,
        dockerRunInstructions: sourceEnvironment.dockerRunInstructions,
        compileText: sourceEnvironment.compileText,
        dockerfile: sourceEnvironment.dockerfile,
        buildType: sourceEnvironment.buildType,
        allowNetworkAccess: sourceEnvironment.allowNetworkAccess,
        maxStudentTestRuns: sourceEnvironment.maxStudentTestRuns,
        maxExposedFailedTests: sourceEnvironment.maxExposedFailedTests,
        autoDetect: sourceEnvironment.autoDetect,
        requirements: sourceEnvironment.requirements,
        envVars: sourceEnvironment.envVars,
    });

const createRubricCategoryPayload = (sourceCategory, destinationAssignmentId) =>
    pickDefined({
        id: -1,
        assignment: destinationAssignmentId,
        name: sourceCategory.name,
        pointLimit: sourceCategory.pointLimit,
        sortKey: sourceCategory.sortKey,
        helpText: sourceCategory.helpText,
        atMostOnce: sourceCategory.atMostOnce,
        rubricComments: [],
    });

const createRubricCommentPayload = (sourceComment, destinationCategoryId) =>
    pickDefined({
        id: -1,
        category: destinationCategoryId,
        text: sourceComment.text,
        pointDelta: sourceComment.pointDelta,
        sortKey: sourceComment.sortKey,
        explanation: sourceComment.explanation,
        instructionText: sourceComment.instructionText,
        templateTextOn: sourceComment.templateTextOn,
        name: sourceComment.name,
    });

const createTestCategoryPayload = (sourceCategory, destinationAssignmentId) =>
    pickDefined({
        id: -1,
        assignment: destinationAssignmentId,
        name: sourceCategory.name,
        testScript: sourceCategory.testScript,
        maxPoints: sourceCategory.maxPoints,
        sortKey: sourceCategory.sortKey,
        targetFileName: sourceCategory.targetFileName,
        testCases: [],
        resources: [],
    });

const MAX_TEST_DESCRIPTION_LEN = 48;

const normalizeTestDescriptionAndExplanation = (sourceCase) => {
    const originalDescription = (sourceCase.description || '').trim();
    const existingExplanation = sourceCase.explanation || '';

    if (originalDescription.length <= MAX_TEST_DESCRIPTION_LEN) {
        return {
            description: originalDescription,
            explanation: existingExplanation,
        };
    }

    const trimmedDescription = `${originalDescription.slice(0, MAX_TEST_DESCRIPTION_LEN - 3)}...`;
    const note = `Original test description: ${originalDescription}`;
    const mergedExplanation = existingExplanation ? `${existingExplanation}\n\n${note}` : note;

    return {
        description: trimmedDescription,
        explanation: mergedExplanation,
    };
};

const createTestCasePayload = (sourceCase, destinationTestCategoryId, rubricCommentIdMap) =>
    (() => {
        const normalized = normalizeTestDescriptionAndExplanation(sourceCase);
        return pickDefined({
            id: -1,
            testCategory: destinationTestCategoryId,
            sortKey: sourceCase.sortKey,
            description: normalized.description,
            type: sourceCase.type,
            pointsFail: sourceCase.pointsFail,
            pointsPass: sourceCase.pointsPass,
            text: sourceCase.text,
            exposed: sourceCase.exposed,
            explanation: normalized.explanation,
            testCode: sourceCase.testCode,
            targetCellId: sourceCase.targetCellId,
            functionName: sourceCase.functionName,
            timeout: sourceCase.timeout,
            rubricItem:
                sourceCase.rubricItem && rubricCommentIdMap.has(sourceCase.rubricItem)
                    ? rubricCommentIdMap.get(sourceCase.rubricItem)
                    : null,
        });
    })();

const copyRubric = async (sourceAssignment, destAssignmentId) => {
    const rubricCommentIdMap = new Map();

    for (const sourceCategoryId of sourceAssignment.rubricCategories || []) {
        const sourceCategory = await getRubricCategory(sourceClient, sourceCategoryId);
        const createdCategory = await createRubricCategory(
            destClient,
            createRubricCategoryPayload(sourceCategory, destAssignmentId),
        );

        for (const sourceCommentId of sourceCategory.rubricComments || []) {
            const sourceComment = await getRubricComment(sourceClient, sourceCommentId);
            const createdComment = await createRubricComment(
                destClient,
                createRubricCommentPayload(sourceComment, createdCategory.id),
            );
            rubricCommentIdMap.set(sourceCommentId, createdComment.id);
        }
    }

    return rubricCommentIdMap;
};

const copyTests = async (sourceAssignment, destAssignmentId, rubricCommentIdMap, fileIdMap, datasetIdMap) => {
    for (const sourceTestCategoryId of sourceAssignment.testCategories || []) {
        const sourceTestCategory = await getTestCategory(sourceClient, sourceTestCategoryId);
        const createdCategory = await createTestCategory(
            destClient,
            createTestCategoryPayload(sourceTestCategory, destAssignmentId),
        );

        for (const sourceResource of sourceTestCategory.resources || []) {
            const mappedFile = sourceResource.file ? fileIdMap.get(sourceResource.file) : null;
            const mappedDataset = sourceResource.dataset ? datasetIdMap.get(sourceResource.dataset) : null;

            if (!mappedFile && !mappedDataset) {
                continue;
            }

            await createTestCategoryResource(destClient, {
                category: createdCategory.id,
                file: mappedFile || null,
                dataset: mappedDataset || null,
                targetPath: sourceResource.targetPath,
            });
        }

        for (const sourceTestCaseId of sourceTestCategory.testCases || []) {
            const sourceTestCase = await getTestCase(sourceClient, sourceTestCaseId);
            const payload = createTestCasePayload(sourceTestCase, createdCategory.id, rubricCommentIdMap);
            await createTestCase(destClient, payload);
        }
    }
};

const copyAssignmentAssets = async (sourceAssignment, createdAssignment) => {
    const fileIdMap = new Map();
    const datasetIdMap = new Map();

    for (const sourceFileId of sourceAssignment.files || []) {
        const sourceFile = await getAssignmentFile(sourceClient, sourceFileId);
        const createdFile = await createAssignmentFile(destClient, createAssignmentFilePayload(sourceFile, createdAssignment.id));
        fileIdMap.set(sourceFileId, createdFile.id);
    }

    for (const sourceDataSetId of sourceAssignment.dataSets || []) {
        const sourceDataSet = await getAssignmentDataSet(sourceClient, sourceDataSetId);
        const { blob, fileNameFromHeader } = await downloadAssignmentDataSetBlob(sourceClient, sourceDataSetId);

        const createdDataSet = await createAssignmentDataSetFromBlob(destClient, {
            assignment: createdAssignment.id,
            name: sourceDataSet.name,
            description: sourceDataSet.description,
            mountPath: sourceDataSet.mountPath,
            isActive: sourceDataSet.isActive,
            hidden: sourceDataSet.hidden,
            isTestResource: sourceDataSet.isTestResource,
            blob,
            fileName: fileNameFromHeader || sourceDataSet.fileName || sourceDataSet.name,
        });

        datasetIdMap.set(sourceDataSetId, createdDataSet.id);
    }

    if (sourceAssignment.environment) {
        const sourceEnvironment = await getEnvironment(sourceClient, sourceAssignment.environment);
        const environmentPayload = createEnvironmentPayload(sourceEnvironment, createdAssignment.id);
        if (createdAssignment.environment) {
            await updateEnvironment(destClient, createdAssignment.environment, environmentPayload);
        } else {
            await createEnvironment(destClient, environmentPayload);
        }
    }

    return { fileIdMap, datasetIdMap };
};

const main = async () => {
    runConfig = await getConfig();

    sourceClient = {
        baseUrl: runConfig.sourceBaseUrl,
        baseUrls: buildBaseUrlCandidates(runConfig.sourceBaseUrl),
        resolvedBaseUrl: null,
        authHeader: buildAuthHeader(runConfig.sourceAuth, 'SOURCE'),
    };

    destClient = {
        baseUrl: runConfig.destBaseUrl,
        baseUrls: buildBaseUrlCandidates(runConfig.destBaseUrl),
        resolvedBaseUrl: null,
        authHeader: buildAuthHeader(runConfig.destAuth, 'DEST'),
    };

    console.log('🔎 Loading source course...');
    const sourceCourse = await getCourse(sourceClient, runConfig.sourceCourseId);

    let destinationCourse;
    if (runConfig.destCourseId) {
        destinationCourse = await getCourse(destClient, Number(runConfig.destCourseId));
    } else {
        const basePayload = createCoursePayloadFromSource(sourceCourse);
        const { payload, renamed, originalName } = await ensureUniqueCourseNameForPeriod(destClient, basePayload);

        if (renamed) {
            console.log(
                `⚠️ Destination course name collision detected for period '${payload.period}'. Renaming '${originalName}' -> '${payload.name}'.`,
            );
        }

        if (runConfig.dryRun) {
            console.log('\n🧪 Dry run: destination course would be created with payload:');
            console.log(JSON.stringify(payload, null, 2));
            destinationCourse = { id: -1, name: payload.name, period: payload.period, assignments: [] };
        } else {
            console.log('📘 Creating destination course...');
            destinationCourse = await createCourse(destClient, payload);
        }
    }

    console.log(`📗 Source: ${sourceCourse.name} (${sourceCourse.period}) [${sourceCourse.id}] @ ${sourceClient.baseUrl}`);
    console.log(
        `📙 Destination: ${destinationCourse.name} (${destinationCourse.period}) [${destinationCourse.id}] @ ${destClient.baseUrl}`,
    );

    const sourceAssignmentIds = Array.isArray(sourceCourse.assignments) ? sourceCourse.assignments : [];
    if (sourceAssignmentIds.length === 0) {
        console.log('ℹ️ Source course has no assignments. Nothing to copy.');
        return;
    }

    const [sourceAssignments, destAssignments] = await Promise.all([
        Promise.all(sourceAssignmentIds.map((id) => getAssignment(sourceClient, id))),
        destinationCourse.id > 0 && Array.isArray(destinationCourse.assignments)
            ? Promise.all(destinationCourse.assignments.map((id) => getAssignment(destClient, id)))
            : Promise.resolve([]),
    ]);

    const filtered = sourceAssignments
        .filter((a) => (runConfig.onlyNames ? runConfig.onlyNames.has(a.name) : true))
        .sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));

    const destNames = new Set(destAssignments.map((a) => a.name));
    const toCopy = runConfig.allowDuplicates ? filtered : filtered.filter((a) => !destNames.has(a.name));
    const skipped = filtered.filter((a) => !toCopy.some((x) => x.id === a.id));

    console.log(`\n🧪 Dry run: ${runConfig.dryRun ? 'YES' : 'NO'}`);
    console.log(`📦 Candidate assignments: ${filtered.length}`);
    console.log(`✅ Will copy: ${toCopy.length}`);
    console.log(`⏭️ Skipped duplicates: ${skipped.length}`);

    if (skipped.length) {
        console.log('\nSkipped assignment names:');
        skipped.forEach((a) => console.log(`  - ${a.name}`));
    }

    if (toCopy.length === 0) {
        console.log('\n✅ Nothing to copy.');
        return;
    }

    if (runConfig.dryRun) {
        console.log('\nWould copy these assignments:');
        toCopy.forEach((a) => console.log(`  - [${a.id}] ${a.name}`));
        return;
    }

    for (const sourceAssignment of toCopy) {
        console.log(`\n🚀 Copying assignment: [${sourceAssignment.id}] ${sourceAssignment.name}`);

        const createdAssignment = await createAssignment(
            destClient,
            createAssignmentPayloadFromSource(sourceAssignment, destinationCourse.id),
        );

        const { fileIdMap, datasetIdMap } = await copyAssignmentAssets(sourceAssignment, createdAssignment);

        const rubricCommentIdMap = await copyRubric(sourceAssignment, createdAssignment.id);
        await copyTests(sourceAssignment, createdAssignment.id, rubricCommentIdMap, fileIdMap, datasetIdMap);

        console.log(`✅ Created destination assignment [${createdAssignment.id}] ${createdAssignment.name}`);
    }

    console.log('\n🎉 Copy complete.');
};

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
