const express = require('express');
const { editSuspect, chargeDescription, victims } = require('../../data/session-data-defaults.js');
const router = express.Router();
const version = 'version-18'

function getQueryString(req) {
    return req.url.includes('?') ? `?${req.url.split('?')[1]}` : '';
}

function redirectLegacyLccPath(req, res) {
    if (req.path === '/create-case' || req.path.startsWith('/create-case/')) {
        const registerCasePath = req.path.replace('/create-case', '/register-case');
        return res.redirect(`/version-18/lcc${registerCasePath}${getQueryString(req)}`);
    }

    res.redirect(`/version-18/lcc/materials${req.path}${getQueryString(req)}`);
}

router.use('/B-off-system-MVP', redirectLegacyLccPath);
router.use('/materials', redirectLegacyLccPath);

router.use('/lcc', function (req, res, next) {
    if (req.path === '/materials' || req.path.startsWith('/materials/')) return next();
    if (req.path === '/register-case' || req.path.startsWith('/register-case/')) return next();
    if (req.path === '/create-case' || req.path.startsWith('/create-case/')) {
        const registerCasePath = req.path.replace('/create-case', '/register-case');
        return res.redirect(`/version-18/lcc${registerCasePath}${getQueryString(req)}`);
    }

    res.redirect(`/version-18/lcc/materials${req.path}${getQueryString(req)}`);
});

function getSafeReturnTo(returnTo) {
    if (typeof returnTo !== 'string' || !returnTo.startsWith('/version-18/')) {
        return null;
    }

    return returnTo;
}

function isUnder18(day, month, year) {
    const parsedDay = Number(day);
    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (!parsedDay || !parsedMonth || !parsedYear) {
        return false;
    }

    const dob = new Date(parsedYear, parsedMonth - 1, parsedDay);

    if (
        dob.getFullYear() !== parsedYear ||
        dob.getMonth() !== parsedMonth - 1 ||
        dob.getDate() !== parsedDay
    ) {
        return false;
    }

    const today = new Date();
    let age = today.getFullYear() - parsedYear;
    const birthdayHasPassedThisYear =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= parsedDay);

    if (!birthdayHasPassedThisYear) {
        age -= 1;
    }

    return age < 18;
}

function shouldAskOffenderType(value) {
    return value === 'Type of offender';
}

function hasYouthOffenderType(value) {
    return value === 'Youth offender (YO)' ||
        value === 'Prolific youth offender (PYO)' ||
        value === 'Both prolific priority offender (PPO) and prolific youth offender (PYO)';
}

function isYouthSuspect(data, id) {
    if (isUnder18(
        data?.suspectDayBirth?.[id],
        data?.suspectMonthBirth?.[id],
        data?.suspectYearBirth?.[id]
    )) {
        return true;
    }

    return hasYouthOffenderType(data?.suspectOffenderType?.[id]);
}

function asChargeVictimFlag(value, expectedValue) {
    return value === expectedValue ? expectedValue : '';
}

function asArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (value === undefined || value === null || value === '') {
        return [];
    }

    return [value];
}

function trimString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function resetCreateCaseSuspectsAndCharges(req) {
    req.session.data.suspectCount = 0;
    req.session.data.suspectDetailsCount = 0;
    req.session.data.pendingSuspectId = undefined;
    req.session.data.suspectId = [];
    req.session.data.suspectType = [];
    req.session.data.suspectFirstName = [];
    req.session.data.suspectLastName = [];
    req.session.data.suspectDOB = [];
    req.session.data.suspectCompanyName = [];
    req.session.data.suspectDayBirth = [];
    req.session.data.suspectMonthBirth = [];
    req.session.data.suspectYearBirth = [];
    req.session.data.suspectGender = [];
    req.session.data.suspectDisability = [];
    req.session.data.suspectReligion = [];
    req.session.data.suspectEthnicity = [];
    req.session.data.suspectSDO = [];
    req.session.data.suspectArrestSummons = [];
    req.session.data.suspectOffenderType = [];
    req.session.data.suspectAlias = [];
    req.session.data.arrestDate = [];
    req.session.data.forceOffenderTypeAfterDob = [];
    req.session.data.removeSuspectId = '';
    req.session.data.aliasId = [];
    req.session.data.aliasFirstName = [];
    req.session.data.aliasLastName = [];
    req.session.data.aliasCount = 0;
    req.session.data.aliasDetailsCount = 0;
    req.session.data.aliasSuspectID = [];
    req.session.data.aliasTempSuspectId = 0;
    req.session.data.editSuspect = 999;
    req.session.data.displaySuspect = 999;

    req.session.data.wantToAddCharges = '';
    req.session.data.chargeCount = 0;
    req.session.data.chargeId = [];
    req.session.data.chargeSuspectId = [];
    req.session.data.chargeVictimId = [];
    req.session.data.chargeCode = [];
    req.session.data.chargeDescription = [];
    req.session.data.chargeFromDay = [];
    req.session.data.chargeFromMonth = [];
    req.session.data.chargeFromYear = [];
    req.session.data.chargeToDay = [];
    req.session.data.chargeToMonth = [];
    req.session.data.chargeToYear = [];
    req.session.data.chargeComments = [];
    req.session.data.chargeVictimYesNo = [];
    req.session.data.chargeVictimFirstName = [];
    req.session.data.chargeVictimLastName = [];
    req.session.data.chargeVictimVulnerable = [];
    req.session.data.chargeVictimIntimidated = [];
    req.session.data.chargeVictimWitness = [];
    req.session.data.offenceAddress1 = [];
    req.session.data.offenceAddress2 = [];
    req.session.data.offenceTown = [];
    req.session.data.offencePostcode = [];
    req.session.data.offenceCountry = [];
    req.session.data.currentSuspectId = 0;
    req.session.data.currentChargeId = 0;
    req.session.data.chargedWithAdult = [];
    req.session.data.grouped = [];
    req.session.data.counts = [];
    req.session.data.victims = JSON.parse(JSON.stringify(victims));
    req.session.data.countVictims = 0;
    req.session.data.preCharge = 'No';
}

const suspectSummaryPath = '/version-18/lcc/register-case/03B-suspect-summary';

function commitPendingSuspect(data) {
    const pendingSuspectId = Number(data.pendingSuspectId);

    if (!Number.isInteger(pendingSuspectId) || pendingSuspectId < 0) {
        return;
    }

    if (!Array.isArray(data.suspectId)) {
        data.suspectId = [];
    }

    if (!data.suspectId.map(String).includes(String(pendingSuspectId))) {
        data.suspectId.push(pendingSuspectId);
    }

    data.suspectCount = Math.max(Number(data.suspectCount || 0), pendingSuspectId + 1);
    data.suspectDetailsYesNo = 'Yes';
    data.pendingSuspectId = undefined;
}

function redirectToSuspectSummary(req, res) {
    commitPendingSuspect(req.session.data);
    req.session.data.displaySuspect = 999;
    req.session.data.editSuspect = 999;

    const returnTo = getCreateCaseReturnTo(req);
    if (returnTo) {
        clearCreateCaseReturnTo(req);
        return res.redirect(returnTo);
    }

    res.redirect(suspectSummaryPath);
}

function redirectToSuspectRoute(req, res, route) {
    if (route === suspectSummaryPath) {
        return redirectToSuspectSummary(req, res);
    }

    res.redirect(route);
}

function hasSuspectDetail(value) {
    return value !== undefined && value !== null && value !== '';
}

function firstSuspectDetailsRoute(data, count) {
    if (
        hasSuspectDetail(data.suspectDOB[count]) ||
        hasSuspectDetail(data.suspectDayBirth[count]) ||
        hasSuspectDetail(data.suspectMonthBirth[count]) ||
        hasSuspectDetail(data.suspectYearBirth[count])
    ) {
        return '/version-18/lcc/register-case/03-suspect-details-dob';
    }
    if (shouldAskOffenderType(data.suspectOffenderType[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-offender-type';
    }
    if (hasSuspectDetail(data.suspectGender[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-gender';
    }
    if (hasSuspectDetail(data.suspectDisability[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-disability';
    }
    if (hasSuspectDetail(data.suspectReligion[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-religion';
    }
    if (hasSuspectDetail(data.suspectEthnicity[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-ethnicity';
    }
    if (hasSuspectDetail(data.suspectAlias[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-add-alias';
    }
    if (hasSuspectDetail(data.suspectSDO[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-sdo';
    }
    if (hasSuspectDetail(data.suspectArrestSummons[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-arrest-summons';
    }

    return suspectSummaryPath;
}

function selectedSuspectDetail(bodyValue, currentValue, placeholder) {
    if (bodyValue === undefined) {
        return undefined;
    }

    if (hasSuspectDetail(currentValue) && currentValue !== placeholder) {
        return currentValue;
    }

    return placeholder;
}

function getCreateCaseReturnTo(req) {
    return getSafeReturnTo(req.query?.returnTo) ||
        getSafeReturnTo(req.body?.returnTo) ||
        getSafeReturnTo(req.session?.data?.createCaseReturnTo);
}

function setCreateCaseReturnTo(req) {
    const returnTo = getCreateCaseReturnTo(req);

    if (returnTo) {
        req.session.data.createCaseReturnTo = returnTo;
    }

    return returnTo;
}

function clearCreateCaseReturnTo(req) {
    if (req.session?.data) {
        delete req.session.data.createCaseReturnTo;
    }
}

function nextSuspectDetailsRouteAfterOffenderType(data, count) {
    if (hasSuspectDetail(data.suspectGender[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-gender';
    }
    if (hasSuspectDetail(data.suspectDisability[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-disability';
    }
    if (hasSuspectDetail(data.suspectReligion[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-religion';
    }
    if (hasSuspectDetail(data.suspectEthnicity[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-ethnicity';
    }
    if (hasSuspectDetail(data.suspectAlias[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-add-alias';
    }
    if (hasSuspectDetail(data.suspectSDO[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-sdo';
    }
    if (hasSuspectDetail(data.suspectArrestSummons[count])) {
        return '/version-18/lcc/register-case/03-suspect-details-arrest-summons';
    }

    return '/version-18/lcc/register-case/03B-suspect-summary';
}

function nextSuspectDetailsRouteAfter(data, count, currentDetail) {
    const remainingRoutes = {
        dob: [
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type'],
            ['gender', () => hasSuspectDetail(data.suspectGender[count]), '/version-18/lcc/register-case/03-suspect-details-gender'],
            ['disability', () => hasSuspectDetail(data.suspectDisability[count]), '/version-18/lcc/register-case/03-suspect-details-disability'],
            ['religion', () => hasSuspectDetail(data.suspectReligion[count]), '/version-18/lcc/register-case/03-suspect-details-religion'],
            ['ethnicity', () => hasSuspectDetail(data.suspectEthnicity[count]), '/version-18/lcc/register-case/03-suspect-details-ethnicity'],
            ['alias', () => hasSuspectDetail(data.suspectAlias[count]), '/version-18/lcc/register-case/03-suspect-details-add-alias'],
            ['sdo', () => hasSuspectDetail(data.suspectSDO[count]), '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons']
        ],
        offenderType: [
            ['gender', () => data.suspectGender[count] === 'Gender', '/version-18/lcc/register-case/03-suspect-details-gender'],
            ['disability', () => data.suspectDisability[count] === 'Disability', '/version-18/lcc/register-case/03-suspect-details-disability'],
            ['religion', () => data.suspectReligion[count] === 'Religion', '/version-18/lcc/register-case/03-suspect-details-religion'],
            ['ethnicity', () => data.suspectEthnicity[count] === 'Ethnicity', '/version-18/lcc/register-case/03-suspect-details-ethnicity'],
            ['alias', () => data.suspectAlias[count] === 'Alias details', '/version-18/lcc/register-case/03-suspect-details-add-alias'],
            ['sdo', () => data.suspectSDO[count] === 'Serious Dangerous Offender (SDO)', '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => data.suspectArrestSummons[count] === 'Arrest summons', '/version-18/lcc/register-case/03-suspect-details-arrest-summons']
        ],
        gender: [
            ['disability', () => hasSuspectDetail(data.suspectDisability[count]), '/version-18/lcc/register-case/03-suspect-details-disability'],
            ['religion', () => hasSuspectDetail(data.suspectReligion[count]), '/version-18/lcc/register-case/03-suspect-details-religion'],
            ['ethnicity', () => hasSuspectDetail(data.suspectEthnicity[count]), '/version-18/lcc/register-case/03-suspect-details-ethnicity'],
            ['alias', () => hasSuspectDetail(data.suspectAlias[count]), '/version-18/lcc/register-case/03-suspect-details-add-alias'],
            ['sdo', () => hasSuspectDetail(data.suspectSDO[count]), '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons'],
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ],
        disability: [
            ['religion', () => hasSuspectDetail(data.suspectReligion[count]), '/version-18/lcc/register-case/03-suspect-details-religion'],
            ['ethnicity', () => hasSuspectDetail(data.suspectEthnicity[count]), '/version-18/lcc/register-case/03-suspect-details-ethnicity'],
            ['alias', () => hasSuspectDetail(data.suspectAlias[count]), '/version-18/lcc/register-case/03-suspect-details-add-alias'],
            ['sdo', () => hasSuspectDetail(data.suspectSDO[count]), '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons'],
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ],
        religion: [
            ['ethnicity', () => hasSuspectDetail(data.suspectEthnicity[count]), '/version-18/lcc/register-case/03-suspect-details-ethnicity'],
            ['alias', () => hasSuspectDetail(data.suspectAlias[count]), '/version-18/lcc/register-case/03-suspect-details-add-alias'],
            ['sdo', () => hasSuspectDetail(data.suspectSDO[count]), '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons'],
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ],
        ethnicity: [
            ['alias', () => hasSuspectDetail(data.suspectAlias[count]), '/version-18/lcc/register-case/03-suspect-details-add-alias'],
            ['sdo', () => hasSuspectDetail(data.suspectSDO[count]), '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons'],
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ],
        alias: [
            ['sdo', () => hasSuspectDetail(data.suspectSDO[count]), '/version-18/lcc/register-case/03-suspect-details-sdo'],
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons'],
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ],
        sdo: [
            ['arrestSummons', () => hasSuspectDetail(data.suspectArrestSummons[count]), '/version-18/lcc/register-case/03-suspect-details-arrest-summons'],
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ],
        arrestSummons: [
            ['offenderType', () => shouldAskOffenderType(data.suspectOffenderType[count]), '/version-18/lcc/register-case/03-suspect-details-offender-type']
        ]
    };

    const routes = remainingRoutes[currentDetail] || [];
    const next = routes.find(([, shouldVisit]) => shouldVisit());

    return next ? next[2] : '/version-18/lcc/register-case/03B-suspect-summary';
}

function removeAliasesForCurrentSuspect(data, count) {
    if (!Array.isArray(data.aliasId)) return;

    data.aliasId
        .filter(aliasId => String(data.aliasSuspectID?.[aliasId]) === String(count))
        .forEach(aliasId => {
            data.aliasId[aliasId] = undefined;
            if (data.aliasFirstName) data.aliasFirstName[aliasId] = undefined;
            if (data.aliasLastName) data.aliasLastName[aliasId] = undefined;
            if (data.aliasSuspectID) data.aliasSuspectID[aliasId] = undefined;
        });

    data.aliasId = data.aliasId.filter(aliasId => aliasId != undefined);
}

function skipSuspectDetail(req, res, detail) {
    const data = req.session.data;
    const count = data.suspectDetailsCount;

    if (detail === 'dob') {
        data.suspectDOB[count] = undefined;
        data.suspectDayBirth[count] = undefined;
        data.suspectMonthBirth[count] = undefined;
        data.suspectYearBirth[count] = undefined;
        if (Array.isArray(data.forceOffenderTypeAfterDob)) {
            data.forceOffenderTypeAfterDob[count] = false;
        }
    }
    if (detail === 'gender') data.suspectGender[count] = undefined;
    if (detail === 'disability') data.suspectDisability[count] = undefined;
    if (detail === 'religion') data.suspectReligion[count] = undefined;
    if (detail === 'ethnicity') data.suspectEthnicity[count] = undefined;
    if (detail === 'alias') {
        data.suspectAlias[count] = undefined;
        removeAliasesForCurrentSuspect(data, count);
    }
    if (detail === 'sdo') data.suspectSDO[count] = undefined;
    if (detail === 'arrestSummons') data.suspectArrestSummons[count] = undefined;
    if (detail === 'offenderType') {
        data.suspectOffenderType[count] = undefined;
        if (data.arrestDate) data.arrestDate[count] = undefined;
        if (Array.isArray(data.forceOffenderTypeAfterDob)) {
            data.forceOffenderTypeAfterDob[count] = false;
        }
    }

    redirectToSuspectRoute(req, res, nextSuspectDetailsRouteAfter(data, count, detail));
}

// Make session data available in all Nunjucks templates as "data"
router.use((req, res, next) => {
    res.locals.data = req.session.data || {};
    res.locals.encodedCurrentPath = encodeURIComponent(req.originalUrl);
    res.locals.returnTo = setCreateCaseReturnTo(req);
    res.locals.isYouthSuspect = function (id) {
        return isYouthSuspect(req.session.data || {}, id);
    };
    next();
});


router.use((req, res, next) => {
    if (!Array.isArray(req.session.data.materialsVersion17)) {
        const defaults =
            res.locals.data.materialsVersion17 ||
            res.locals.data.materialsVersion15 ||
            res.locals.data.materialsVersion13 ||
            res.locals.data.materials ||
            [];
        req.session.data.materialsVersion17 = JSON.parse(JSON.stringify(defaults));
    }

    const hasFileInUseExample = req.session.data.materialsVersion17.some(item =>
        item &&
        !item.folder &&
        item.name === 'File A' &&
        Number(item.parentId) === 1007
    );

    if (!hasFileInUseExample) {
        req.session.data.materialsVersion17.push({
            id: 'version-18-file-a',
            name: 'File A',
            order: '',
            description: 'This file is currently in use by another user',
            category: 'Exhibit list - MG12',
            date: '1 Jul 2024',
            status: 'Used',
            new: false,
            docLink: 'MG00.pdf',
            previewLink: '/public/files/blank.pdf',
            parentId: 1007,
            folder: false,
            level: 3
        });
    }

    Object.defineProperty(req.session.data, 'materials', {
        get() {
            return this.materialsVersion17;
        },
        set(value) {
            this.materialsVersion17 = value;
        },
        configurable: true
    });

    res.locals.data.materialsVersion17 = req.session.data.materialsVersion17;
    res.locals.data.materials = req.session.data.materialsVersion17;

    next();
});


// Add your routes here - above the module.exports line


// Register a case - start of journey
router.post('/lcc/register-case/01-register-case', function (req, res) {
    const operationNameYesNo = req.body['operation-name-yes-no']
    const suspectDetailsYesNo = req.body['suspect-details-yes-no']
    const operationName = trimString(req.body['operation-name'])

    req.session.data.operationNameYesNo = operationNameYesNo
    req.session.data.suspectDetailsYesNo = suspectDetailsYesNo
    req.session.data.operationName = operationName
    req.session.data.firstHearingDetailsYesNo = req.body['first-hearing-details']

    const errors = {}
    const errorList = []

    if (!operationNameYesNo) {
        errors.operationNameYesNo = 'Select if you have an operation name'
        errorList.push({
            text: errors.operationNameYesNo,
            href: '#operation-name-yes'
        })
    }

    if (!suspectDetailsYesNo) {
        errors.suspectDetailsYesNo = 'Select if you have suspect details'
        errorList.push({
            text: errors.suspectDetailsYesNo,
            href: '#suspect-details-yes'
        })
    }

    if (operationNameYesNo === 'Yes' && !operationName) {
        errors.operationName = 'Enter an operation name'
        errorList.push({
            text: errors.operationName,
            href: '#operation-name'
        })
    }

    if (operationNameYesNo === 'No' && suspectDetailsYesNo === 'No') {
        errors.page = 'You must add an operation name or suspect details to continue'
        errorList.unshift({
            text: errors.page,
            href: '#operation-name-yes'
        })
    }

    if (errorList.length > 0) {
        return res.render('version-18/lcc/register-case/01-register-case', {
            errors,
            errorList
        })
    }

    if (req.session.data.suspectDetailsYesNo !== 'Yes') {
        resetCreateCaseSuspectsAndCharges(req)
    }

    if (req.session.data.firstHearingDetailsYesNo === 'Yes') {
        req.session.data.courtLocation = req.body['court-location']
        req.session.data.firstHearingDate = req.body['newCase_FirstHearing_Date']
    }

    res.redirect('/version-18/lcc/register-case/02-area')
    // }
    // else {
    //     res.render('version-18/lcc/register-case/01-register-case', { 
    //         errors: errors
    //     })
    // }
})

// Area page
router.post('/lcc/register-case/02-area', function (req, res) {
    const area = (req.body['docType-Area'] || '').trim()

    if (!area) {
        return res.render('version-18/lcc/register-case/02-area', {
            areaError: 'Select a division or area'
        })
    }

    req.session.data.area = area
    res.redirect('/version-18/lcc/register-case/02-case-details')
})

// Case details page
router.post('/lcc/register-case/02-case-details', function (req, res) {
    console.log("Case details page submitted")

    const URN1 = (req.body['newCase_URN-A'] || '').trim()
    const URN2 = (req.body['newCase_URN-B'] || '').trim()
    const URN3 = (req.body['newCase_URN-C'] || '').trim()
    const URN4 = (req.body['newCase_URN-D'] || '').trim()
    const caseUrn = `${URN1}${URN2}${URN3}${URN4}`
    const registeringUnit = (req.body['newCase_RegisteringUnit'] || '').trim()
    const WCU = (req.body['newCase_WCU'] || '').trim()

    req.session.data.URN1 = URN1
    req.session.data.URN2 = URN2
    req.session.data.URN3 = URN3
    req.session.data.URN4 = URN4
    req.session.data.caseUrn = caseUrn
    req.session.data.registeringUnit = registeringUnit
    req.session.data.WCU = WCU

    const errors = {}

    if (URN2.length <= 1) {
        errors.urn = 'Enter the URN'
    } else if (URN2 === '87') {
        errors.urn = 'This URN already exists in CMS'
    }

    if (!registeringUnit) {
        errors.registeringUnit = 'Select the registering unit'
    }

    if (!WCU) {
        errors.wcu = 'Select the witness care unit'
    }

    if (Object.keys(errors).length > 0) {
        return res.render('version-18/lcc/register-case/02-case-details', {
            errors
        })
    }

    if (req.session.data.suspectDetailsYesNo === 'Yes') {
        res.redirect('/version-18/lcc/register-case/03-add-suspect')
    }
    else {
        const valueToRemove = 'Pre-Charge Decision'

        req.session.data.newCase_MonitoringCodes = asArray(req.session.data.newCase_MonitoringCodes).filter(item => item !== valueToRemove)

        const suspects = [].concat(req.session.data.suspectId).map(String)
        const charged = [].concat(req.session.data.chargeSuspectId).map(String)

        const hasUncharged = suspects.some(id => !charged.includes(id))
        req.session.data.preCharge = hasUncharged ? 'Yes' : 'No'

        res.redirect('/version-18/lcc/register-case/06-monitoring-codes')
    }
})


// First hearing details
router.post('/lcc/register-case/02-first-hearing-details', function (req, res) {
    const returnTo = getCreateCaseReturnTo(req)

    req.session.data.firstHearingDetailsYesNo = req.body['first-hearing-details']

    if (req.session.data.firstHearingDetailsYesNo === 'Yes') {
        req.session.data.courtLocation = req.body['court-location']
        req.session.data.firstHearingDate = req.body['newCase_FirstHearing_Date']
    }

    const valueToRemove = 'Pre-Charge Decision'

    req.session.data.newCase_MonitoringCodes = asArray(req.session.data.newCase_MonitoringCodes).filter(item => item !== valueToRemove)

    const suspects = [].concat(req.session.data.suspectId).map(String)
    const charged = [].concat(req.session.data.chargeSuspectId).map(String)

    const hasUncharged = suspects.some(id => !charged.includes(id))
    req.session.data.preCharge = hasUncharged ? 'Yes' : 'No'

    if (returnTo) {
        clearCreateCaseReturnTo(req)
        return res.redirect(returnTo)
    }

    res.redirect('/version-18/lcc/register-case/06-monitoring-codes')

})



// ************************************************** Suspects **************************************************
// Add suspects
router.get('/lcc/register-case/03-add-suspect', function (req, res) {
    const data = req.session.data;
    const isEditing = data.editSuspect !== undefined && Number(data.editSuspect) !== 999;
    const count = Number(data.suspectCount || 0);
    const pendingSuspectId = Number(data.pendingSuspectId);
    const hasPendingSuspect = Number.isInteger(pendingSuspectId) && pendingSuspectId >= 0;

    if (!isEditing && !hasPendingSuspect) {
        data.editSuspect = 999;
        data.displaySuspect = 999;
        data.suspectType[count] = undefined;
        data.suspectFirstName[count] = undefined;
        data.suspectLastName[count] = undefined;
        data.suspectCompanyName[count] = undefined;
        data.suspectDOB[count] = undefined;
        data.suspectGender[count] = undefined;
        data.suspectDisability[count] = undefined;
        data.suspectReligion[count] = undefined;
        data.suspectEthnicity[count] = undefined;
        data.suspectSDO[count] = undefined;
        data.suspectArrestSummons[count] = undefined;
        data.suspectOffenderType[count] = undefined;
        data.suspectAlias[count] = undefined;
    }

    res.render('version-18/lcc/register-case/03-add-suspect');
})

router.post('/lcc/register-case/03-add-suspect', function (req, res) {
    const data = req.session.data
    const pendingSuspectId = Number(data.pendingSuspectId)
    const postedSuspectIndex = Number(req.body['suspect-index'])
    let count = Number(data.suspectCount || 0)

    if (Number.isInteger(postedSuspectIndex) && postedSuspectIndex >= 0) {
        count = postedSuspectIndex
    }

    if (Number.isInteger(pendingSuspectId) && pendingSuspectId >= 0) {
        count = pendingSuspectId
    }
    const suspectType = req.body['suspect-type']
    const suspectFirstName = trimString(req.body['suspect-person-first-name'])
    const suspectLastName = trimString(req.body['suspect-person-last-name'])
    const suspectCompanyName = trimString(req.body['suspect-company-name'])

    data.pendingSuspectId = count
    data.suspectFirstName[count] = suspectFirstName
    data.suspectLastName[count] = suspectLastName
    data.suspectCompanyName[count] = suspectCompanyName

    const errors = {}
    const errorList = []

    if (!suspectType) {
        errors.suspectType = 'Select whether the suspect is a person or company'
        errorList.push({
            text: errors.suspectType,
            href: '#suspect-type-person'
        })
    }

    if (suspectType === 'Person' && !suspectFirstName) {
        errors.firstName = 'Enter the first name'
        errorList.push({
            text: errors.firstName,
            href: '#suspect-person-first-name'
        })
    }

    if (suspectType === 'Person' && !suspectLastName) {
        errors.lastName = 'Enter the last name'
        errorList.push({
            text: errors.lastName,
            href: '#suspect-person-last-name'
        })
    }

    if (suspectType === 'Company' && !suspectCompanyName) {
        errors.companyName = 'Enter the company name'
        errorList.push({
            text: errors.companyName,
            href: '#suspect-company-name'
        })
    }

    if (errorList.length > 0) {
        data.suspectType[count] = suspectType

        return res.render('version-18/lcc/register-case/03-add-suspect', {
            errors,
            errorList
        })
    }

    data.suspectType[count] = suspectType
    data.aliasTempSuspectId = count

    if (suspectType == 'Person') {
        data.suspectFirstName[count] = suspectFirstName
        data.suspectLastName[count] = suspectLastName
        data.suspectDOB[count] = selectedSuspectDetail(req.body['suspect-person-dob'], data.suspectDOB[count], 'Date of birth')
        data.suspectGender[count] = selectedSuspectDetail(req.body['suspect-person-gender'], data.suspectGender[count], 'Gender')
        data.suspectDisability[count] = selectedSuspectDetail(req.body['suspect-person-disability'], data.suspectDisability[count], 'Disability')
        data.suspectReligion[count] = selectedSuspectDetail(req.body['suspect-person-religion'], data.suspectReligion[count], 'Religion')
        data.suspectEthnicity[count] = selectedSuspectDetail(req.body['suspect-person-ethnicity'], data.suspectEthnicity[count], 'Ethnicity')
        data.suspectSDO[count] = selectedSuspectDetail(req.body['suspect-person-sdo'], data.suspectSDO[count], 'Serious Dangerous Offender (SDO)')
        data.suspectArrestSummons[count] = selectedSuspectDetail(req.body['suspect-person-arrest-summons'], data.suspectArrestSummons[count], 'Arrest summons')
        data.suspectOffenderType[count] = selectedSuspectDetail(req.body['suspect-person-offender-type'], data.suspectOffenderType[count], 'Type of offender')
        data.suspectAlias[count] = selectedSuspectDetail(req.body['suspect-person-alias'], data.suspectAlias[count], 'Alias details')

        if (data.suspectDOB[count] == undefined) {
            data.suspectDayBirth[count] = undefined
            data.suspectMonthBirth[count] = undefined
            data.suspectYearBirth[count] = undefined
            if (Array.isArray(data.forceOffenderTypeAfterDob)) {
                data.forceOffenderTypeAfterDob[count] = false
            }
        }

        if (data.suspectAlias[count] == undefined) {
            removeAliasesForCurrentSuspect(data, count)
        }
        console.log("Arrest summons:", data.suspectArrestSummons[count])
        console.log("Alias:", data.suspectAlias[count])
        console.log("SDO:", data.suspectSDO[count])
    }
    else {
        data.suspectCompanyName[count] = suspectCompanyName
    }

    data.suspectDetailsCount = count

    id = data.suspectDetailsCount

    redirectToSuspectRoute(req, res, firstSuspectDetailsRoute(data, id))

    // redirectToSuspectSummary(req, res)
})


// Suspect details – date of birth
router.get('/lcc/register-case/03-suspect-details-dob-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'dob');
})

router.get('/lcc/register-case/03-suspect-details-gender-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'gender');
})

router.get('/lcc/register-case/03-suspect-details-disability-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'disability');
})

router.get('/lcc/register-case/03-suspect-details-religion-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'religion');
})

router.get('/lcc/register-case/03-suspect-details-ethnicity-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'ethnicity');
})

router.get('/lcc/register-case/03-suspect-details-alias-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'alias');
})

router.get('/lcc/register-case/03-suspect-details-sdo-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'sdo');
})

router.get('/lcc/register-case/03-suspect-details-arrest-summons-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'arrestSummons');
})

router.get('/lcc/register-case/03-suspect-details-offender-type-unknown', function (req, res) {
    skipSuspectDetail(req, res, 'offenderType');
})

router.post('/lcc/register-case/03-suspect-details-dob', function (req, res) {
    count = req.session.data.suspectDetailsCount
    const day = trimString(req.body['date-of-birth-day'])
    const month = trimString(req.body['date-of-birth-month'])
    const year = trimString(req.body['date-of-birth-year'])

    req.session.data.suspectDayBirth[count] = day
    req.session.data.suspectMonthBirth[count] = month
    req.session.data.suspectYearBirth[count] = year

    const errors = {}
    const errorList = []

    if (!day || !month || !year) {
        errors.dateOfBirth = 'Enter the date of birth'
        errorList.push({
            text: errors.dateOfBirth,
            href: '#date-of-birth-day'
        })
    } else {
        const numericDay = Number(day)
        const numericMonth = Number(month)
        const numericYear = Number(year)

        if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 31) {
            errors.day = 'Day must be a valid number'
            errorList.push({
                text: errors.day,
                href: '#date-of-birth-day'
            })
        }

        if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
            errors.month = 'Month must be a valid number'
            errorList.push({
                text: errors.month,
                href: '#date-of-birth-month'
            })
        }

        if (!/^\d{4}$/.test(year)) {
            errors.year = 'Year must be a valid number'
            errorList.push({
                text: errors.year,
                href: '#date-of-birth-year'
            })
        }
    }

    if (errorList.length > 0) {
        return res.render('version-18/lcc/register-case/03-suspect-details-dob', {
            errors,
            errorList
        })
    }

    req.session.data.suspectMonthBirth[count] = Number(month)

    if (isUnder18(
        req.session.data.suspectDayBirth[count],
        req.session.data.suspectMonthBirth[count],
        req.session.data.suspectYearBirth[count]
    )) {
        if (!Array.isArray(req.session.data.forceOffenderTypeAfterDob)) {
            req.session.data.forceOffenderTypeAfterDob = []
        }

        req.session.data.forceOffenderTypeAfterDob[count] = true
        return res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }

    if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else if (hasSuspectDetail(req.session.data.suspectGender[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-gender')
    }
    else if (hasSuspectDetail(req.session.data.suspectDisability[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-disability')
    }
    else if (hasSuspectDetail(req.session.data.suspectReligion[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-religion')
    }
    else if (hasSuspectDetail(req.session.data.suspectEthnicity[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-ethnicity')
    }
    else if (hasSuspectDetail(req.session.data.suspectAlias[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-add-alias')
    }
    else if (hasSuspectDetail(req.session.data.suspectSDO[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-sdo')
    }
    else if (hasSuspectDetail(req.session.data.suspectArrestSummons[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Suspect details – gender
router.post('/lcc/register-case/03-suspect-details-gender', function (req, res) {
    count = req.session.data.suspectDetailsCount
    const gender = req.body['gender']

    if (!gender) {
        return res.render('version-18/lcc/register-case/03-suspect-details-gender', {
            errors: {
                gender: 'Select a gender'
            },
            errorList: [{
                text: 'Select a gender',
                href: '#gender-female',
                skipText: 'I do not have the gender',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-gender-unknown'
            }]
        })
    }

    req.session.data.suspectGender[count] = gender

    if (hasSuspectDetail(req.session.data.suspectDisability[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-disability')
    }
    else if (hasSuspectDetail(req.session.data.suspectReligion[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-religion')
    }
    else if (hasSuspectDetail(req.session.data.suspectEthnicity[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-ethnicity')
    }
    else if (hasSuspectDetail(req.session.data.suspectAlias[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-add-alias')
    }
    else if (hasSuspectDetail(req.session.data.suspectSDO[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-sdo')
    }
    else if (hasSuspectDetail(req.session.data.suspectArrestSummons[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
    }
    else if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Suspect details – disability
router.post('/lcc/register-case/03-suspect-details-disability', function (req, res) {
    count = req.session.data.suspectDetailsCount
    const disability = req.body['disability']

    if (!disability) {
        return res.render('version-18/lcc/register-case/03-suspect-details-disability', {
            errors: {
                disability: 'Select whether the suspect has a disability'
            },
            errorList: [{
                text: 'Select whether the suspect has a disability',
                href: '#disability-yes',
                skipText: 'I do not have disability information',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-disability-unknown'
            }]
        })
    }

    req.session.data.suspectDisability[count] = disability

    if (hasSuspectDetail(req.session.data.suspectReligion[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-religion')
    }
    else if (hasSuspectDetail(req.session.data.suspectEthnicity[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-ethnicity')
    }
    else if (hasSuspectDetail(req.session.data.suspectAlias[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-add-alias')
    }
    else if (hasSuspectDetail(req.session.data.suspectSDO[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-sdo')
    }
    else if (hasSuspectDetail(req.session.data.suspectArrestSummons[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
    }
    else if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Suspect details – religion
router.post('/lcc/register-case/03-suspect-details-religion', function (req, res) {
    count = req.session.data.suspectDetailsCount
    const religion = req.body['religion']

    if (!religion) {
        return res.render('version-18/lcc/register-case/03-suspect-details-religion', {
            errors: {
                religion: 'Select the suspect\'s religion'
            },
            errorList: [{
                text: 'Select the suspect\'s religion',
                href: '#religion-no-religion',
                skipText: 'I do not have the religion',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-religion-unknown'
            }]
        })
    }

    req.session.data.suspectReligion[count] = religion

    if (hasSuspectDetail(req.session.data.suspectEthnicity[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-ethnicity')
    }
    else if (hasSuspectDetail(req.session.data.suspectAlias[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-add-alias')
    }
    else if (hasSuspectDetail(req.session.data.suspectSDO[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-sdo')
    }
    else if (hasSuspectDetail(req.session.data.suspectArrestSummons[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
    }
    else if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Suspect details – ethnicity
router.post('/lcc/register-case/03-suspect-details-ethnicity', function (req, res) {
    count = req.session.data.suspectDetailsCount
    const ethnicity = req.body['ethnicity']

    if (!ethnicity) {
        return res.render('version-18/lcc/register-case/03-suspect-details-ethnicity', {
            errors: {
                ethnicity: 'Select the suspect\'s ethnicity'
            },
            errorList: [{
                text: 'Select the suspect\'s ethnicity',
                href: '#ethnicity-ns',
                skipText: 'I do not have the ethnicity',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-ethnicity-unknown'
            }]
        })
    }

    req.session.data.suspectEthnicity[count] = ethnicity

    if (hasSuspectDetail(req.session.data.suspectAlias[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-add-alias')
    }
    else if (hasSuspectDetail(req.session.data.suspectSDO[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-sdo')
    }
    else if (hasSuspectDetail(req.session.data.suspectArrestSummons[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
    }
    else if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Alias section
// Suspect details – add alias
router.post('/lcc/register-case/03-suspect-details-add-alias', function (req, res) {
    aliasCount = req.session.data.aliasCount
    const aliasFirstName = trimString(req.body['alias-first-name'])
    const aliasLastName = trimString(req.body['alias-last-name'])

    req.session.data.aliasFirstName[aliasCount] = aliasFirstName
    req.session.data.aliasLastName[aliasCount] = aliasLastName

    if (!aliasLastName) {
        return res.render('version-18/lcc/register-case/03-suspect-details-add-alias', {
            errors: {
                aliasLastName: 'Enter a last name. If the person only has one name, enter it here.'
            },
            errorList: [{
                text: 'Enter last name. If the person only has one name, enter it here.',
                href: '#alias-last-name',
                skipText: 'I do not have alias details',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-alias-unknown'
            }]
        })
    }

    req.session.data.aliasId[aliasCount] = aliasCount

    req.session.data.aliasSuspectID[aliasCount] = req.session.data.suspectDetailsCount

    console.log("Alias first name:", req.session.data.aliasFirstName[aliasCount])
    console.log("Alias last name:", req.session.data.aliasLastName[aliasCount])
    console.log("Alias count:", req.session.data.aliasCount)
    console.log("Alias suspect:", req.session.data.aliasSuspectID[aliasCount])
    console.log("Details count:", req.session.data.suspectDetailsCount)
    console.log("Test:", req.session.data.suspectDetailsCount)

    req.session.data.aliasCount = aliasCount + 1
    //    req.session.data.suspectDetailsCount = aliasCount


    res.redirect('/version-18/lcc/register-case/03-suspect-details-alias-summary')
})

// Alias summary
router.post('/lcc/register-case/03-suspect-details-alias-summary', function (req, res) {
    count = req.session.data.suspectDetailsCount
    const addAnother = req.body['add-another']
    const suspectSDO = req.session.data.suspectSDO || []
    const suspectArrestSummons = req.session.data.suspectArrestSummons || []
    const suspectOffenderType = req.session.data.suspectOffenderType || []

    if (!addAnother) {
        return res.render('version-18/lcc/register-case/03-suspect-details-alias-summary', {
            errors: {
                addAnother: 'Select whether you need to add another alias'
            },
            requestBody: req.body,
            errorList: [{
                text: 'Select whether you need to add another alias',
                href: '#add-another',
                skipText: 'I do not have alias details',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-alias-unknown'
            }]
        })
    }

    if (addAnother === 'Yes') {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-add-alias')
    }
    else {
        if (suspectSDO[count] != undefined) {
            res.redirect('/version-18/lcc/register-case/03-suspect-details-sdo')
        }
        else if (suspectArrestSummons[count] != undefined) {
            res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
        }
        else if (shouldAskOffenderType(suspectOffenderType[count])) {
            res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
        }
        else {
            redirectToSuspectSummary(req, res)
        }
    }
})
// End of alias section


// Suspect details – SDO
router.post('/lcc/register-case/03-suspect-details-sdo', function (req, res) {
    count = req.session.data.suspectDetailsCount

    req.session.data.suspectSDO[count] = req.body['sdo']

    if (hasSuspectDetail(req.session.data.suspectArrestSummons[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-arrest-summons')
    }
    else if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Suspect details – arrest summons
router.post('/lcc/register-case/03-suspect-details-arrest-summons', function (req, res) {
    count = req.session.data.suspectDetailsCount

    const arrestSummons = (req.body['arrest-summons'] || '').trim()

    req.session.data.suspectArrestSummons[count] = arrestSummons

    if (!arrestSummons) {
        return res.render('version-18/lcc/register-case/03-suspect-details-arrest-summons', {
            arrestSummonsError: 'Select an Arrest Summons Number (ASN)'
        })
    }

    if (shouldAskOffenderType(req.session.data.suspectOffenderType[count])) {
        res.redirect('/version-18/lcc/register-case/03-suspect-details-offender-type')
    }
    else {
        redirectToSuspectSummary(req, res)
    }
})


// Suspect details – type of offender
router.post('/lcc/register-case/03-suspect-details-offender-type', function (req, res) {
    count = (req.session.data.suspectDetailsCount)
    const offenderType = req.body['offender-type']

    if (!offenderType) {
        return res.render('version-18/lcc/register-case/03-suspect-details-offender-type', {
            errors: {
                offenderType: 'Select the type of offender'
            },
            errorList: [{
                text: 'Select the type of offender',
                href: '#offender-type-pyo',
                skipText: 'I do not have the type of offender',
                skipHref: '/version-18/lcc/register-case/03-suspect-details-offender-type-unknown'
            }]
        })
    }

    req.session.data.suspectOffenderType[count] = offenderType
    console.log("Offender type:", req.session.data.suspectOffenderType[count])

    if (req.session.data.suspectOffenderType[count] == 'Youth offender (YO)') {
        req.session.data.arrestDate[count] = req.body['arrest-date-yo']
    }
    else if (req.session.data.suspectOffenderType[count] == 'Both prolific priority offender (PPO) and prolific youth offender (PYO)') {
        req.session.data.arrestDate[count] = req.body['arrest-date-ppo-pyo']
    }
    else if (req.session.data.suspectOffenderType[count] == 'Prolific youth offender (PYO)') {
        req.session.data.arrestDate[count] = req.body['arrest-date-pyo']
    }

    if (Array.isArray(req.session.data.forceOffenderTypeAfterDob) &&
        req.session.data.forceOffenderTypeAfterDob[count]) {
        req.session.data.forceOffenderTypeAfterDob[count] = false
    }

    redirectToSuspectRoute(req, res, nextSuspectDetailsRouteAfterOffenderType(req.session.data, count))
})


// End of add suspects


// Suspect summary
router.post('/lcc/register-case/03B-suspect-summary', function (req, res) {
    const returnTo = getCreateCaseReturnTo(req)
    const addAnother = req.body['add-another-suspect']

    if (!addAnother) {
        return res.render('version-18/lcc/register-case/03B-suspect-summary', {
            errors: {
                addAnother: 'Select whether you need to add another suspect'
            },
            requestBody: req.body,
            errorList: [{
                text: 'Select whether you need to add another suspect',
                href: '#add-another'
            }]
        })
    }

    if (addAnother === 'Yes') {
        res.redirect('/version-18/lcc/register-case/03-add-suspect')
    }
    else {
        if (returnTo) {
            return res.redirect('/version-18/lcc/register-case/04-want-to-add-charges')
        }

        res.redirect('/version-18/lcc/register-case/04-want-to-add-charges')
        // res.redirect('/version-18/lcc/register-case/06-monitoring-codes') 
    }
})


router.post('/lcc/register-case/remove-suspect', function (req, res) {
    req.session.data.removeSuspectId = Number(req.body['remove-suspect-id'])
    res.redirect('/version-18/lcc/register-case/03-remove-suspect')
})


router.post('/lcc/register-case/03-remove-suspect', function (req, res) {
    if (req.body['submit-button'] == 'remove') {
        req.session.data.suspectId.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectType.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectFirstName.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectLastName.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectDOB.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectGender.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectDisability.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectReligion.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectEthnicity.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectSDO.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectArrestSummons.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectOffenderType.splice(req.session.data.removeSuspectId, 1)
        req.session.data.suspectCompanyName.splice(req.session.data.removeSuspectId, 1)

        // Adjust suspect count
        req.session.data.suspectCount = req.session.data.suspectCount - 1

        if (req.session.data.suspectCount == 0) {
            req.session.data.suspectDetailsYesNo = 'No'
        }

        for (let i = 0; i < req.session.data.chargeId.length; i++) {
            if (req.session.data.chargeSuspectId[i] == req.session.data.removeSuspectId) {
                req.session.data.chargeId.splice(i, 1)
            }
        }
    }

    redirectToSuspectSummary(req, res)
})




// Edit suspect
router.post('/lcc/register-case/03-edit-suspect', function (req, res) {
    console.log("Edit suspect ID:", req.session.data.editSuspect)
    console.log("Display suspect ID:", req.session.data.displaySuspect)

    const data = req.session.data
    var x = Number(req.session.data.editSuspect)

    if (req.body['suspect-type'] == 'Person') {
        data.suspectType[x] = req.body['suspect-type']
        data.suspectFirstName[x] = trimString(req.body['suspect-person-first-name'])
        data.suspectLastName[x] = trimString(req.body['suspect-person-last-name'])
        data.suspectCompanyName[x] = ''
        data.suspectDOB[x] = selectedSuspectDetail(req.body['suspect-person-dob'], data.suspectDOB[x], 'Date of birth')
        data.suspectGender[x] = selectedSuspectDetail(req.body['suspect-person-gender'], data.suspectGender[x], 'Gender')
        data.suspectDisability[x] = selectedSuspectDetail(req.body['suspect-person-disability'], data.suspectDisability[x], 'Disability')
        data.suspectReligion[x] = selectedSuspectDetail(req.body['suspect-person-religion'], data.suspectReligion[x], 'Religion')
        data.suspectEthnicity[x] = selectedSuspectDetail(req.body['suspect-person-ethnicity'], data.suspectEthnicity[x], 'Ethnicity')
        data.suspectSDO[x] = selectedSuspectDetail(req.body['suspect-person-sdo'], data.suspectSDO[x], 'Serious Dangerous Offender (SDO)')
        data.suspectArrestSummons[x] = selectedSuspectDetail(req.body['suspect-person-arrest-summons'], data.suspectArrestSummons[x], 'Arrest summons')
        data.suspectOffenderType[x] = selectedSuspectDetail(req.body['suspect-person-offender-type'], data.suspectOffenderType[x], 'Type of offender')
        data.suspectAlias[x] = selectedSuspectDetail(req.body['suspect-person-alias'], data.suspectAlias[x], 'Alias details')

        if (data.suspectDOB[x] == undefined) {
            data.suspectDayBirth[x] = undefined
            data.suspectMonthBirth[x] = undefined
            data.suspectYearBirth[x] = undefined
            if (Array.isArray(data.forceOffenderTypeAfterDob)) {
                data.forceOffenderTypeAfterDob[x] = false
            }
        }

        if (data.suspectAlias[x] == undefined) {
            removeAliasesForCurrentSuspect(data, x)
        }
    }
    else {
        data.suspectType[x] = req.body['suspect-type']
        data.suspectCompanyName[x] = trimString(req.body['suspect-company-name'])
        data.suspectFirstName[x] = ''
        data.suspectLastName[x] = ''
        data.suspectDOB[x] = undefined
        data.suspectDayBirth[x] = undefined
        data.suspectMonthBirth[x] = undefined
        data.suspectYearBirth[x] = undefined
        data.suspectGender[x] = undefined
        data.suspectDisability[x] = undefined
        data.suspectReligion[x] = undefined
        data.suspectEthnicity[x] = undefined
        data.suspectSDO[x] = undefined
        data.suspectArrestSummons[x] = undefined
        data.suspectOffenderType[x] = undefined
        data.suspectAlias[x] = undefined
        removeAliasesForCurrentSuspect(data, x)
    }

    data.suspectDetailsCount = x

    redirectToSuspectRoute(req, res, firstSuspectDetailsRoute(data, x))
})
// End of suspect summary

router.get('/lcc/register-case/03-edit-suspect/:id', function (req, res) {
    const suspectId = Number(req.params.id)

    if (!Number.isInteger(suspectId) || suspectId < 0) {
        return res.redirect('/version-18/lcc/register-case/08-check-answers')
    }

    req.session.data.editSuspect = suspectId
    req.session.data.displaySuspect = suspectId + 1
    res.redirect('/version-18/lcc/register-case/03-add-suspect')
})

router.post('/lcc/register-case/03-edit-suspect-router', function (req, res) {
    req.session.data.editSuspect = Number(req.body['edit-suspect'])
    req.session.data.displaySuspect = Number(req.body['edit-suspect']) + 1
    console.log("Edit suspect ID:", req.session.data.editSuspect)
    console.log("Display suspect ID:", req.session.data.displaySuspect)
    res.redirect('/version-18/lcc/register-case/03-add-suspect')
})
// End of edit suspect

// ************************************************** End of suspects **************************************************



// ************************************************** Start of charges **************************************************

// Want to add charges
router.post('/lcc/register-case/04-want-to-add-charges', function (req, res) {
    const returnTo = getCreateCaseReturnTo(req)

    req.session.data.wantToAddCharges = req.body['add-charges']
    console.log("Want to add charges:", req.session.data.wantToAddCharges)
    console.log("Suspect count:", req.session.data.suspectCount)
    if (req.session.data.wantToAddCharges === 'Yes') {
        if (req.session.data.suspectCount === 1) {
            req.session.data.chargeSuspectId[0] = 0
            console.log("Charge suspect id:", req.session.data.chargeSuspectId[0])
            res.redirect('/version-18/lcc/register-case/04-charges-offence-search')
        }
        else {
            res.redirect('/version-18/lcc/register-case/04-add-charges-suspect')
        }
    }
    else {
        if (returnTo) {
            clearCreateCaseReturnTo(req)
            return res.redirect(returnTo)
        }

        const valueToRemove = 'Pre-Charge Decision'

        req.session.data.newCase_MonitoringCodes = asArray(req.session.data.newCase_MonitoringCodes).filter(item => item !== valueToRemove)

        const suspects = [].concat(req.session.data.suspectId).map(String)
        const charged = [].concat(req.session.data.chargeSuspectId).map(String)

        const hasUncharged = suspects.some(id => !charged.includes(id))
        req.session.data.preCharge = hasUncharged ? 'Yes' : 'No'

        res.redirect('/version-18/lcc/register-case/06-monitoring-codes')
    }
})


// Add charges - select suspect
router.post('/lcc/register-case/04-add-charges-suspect', function (req, res) {
    count = req.session.data.chargeCount

    req.session.data.chargeSuspectId[count] = req.body['suspect-charges']
    if (req.body['suspect-charges'] == 'Suspect not listed') {
        req.session.data.chargeSuspectId[count] = 'Suspect not listed'
    }
    else {
        req.session.data.currentSuspectId = Number(req.session.data.chargeSuspectId[count])
    }
    // console.log("Charge suspect id:",req.session.data.chargeSuspectId[count])

    if (req.session.data.chargeSuspectId[count] == 'Suspect not listed') {
        res.redirect('/version-18/lcc/register-case/03-add-suspect')
    }
    else {
        res.redirect('/version-18/lcc/register-case/04-charges-offence-search')
    }
})

router.post('/lcc/register-case/add-another-charge', function (req, res) {
    // Preset or reset pre-charge info
    req.session.data.preCharge = 'No'
    console.log("Pre-charge set to:", req.session.data.preCharge)

    count = req.session.data.chargeCount
    req.session.data.chargeSuspectId[count] = req.body['add-charge-suspect-id']
    req.session.data.currentSuspectId = req.body['add-charge-suspect-id']
    console.log("Charge suspect id:", req.session.data.chargeSuspectId[count])
    res.redirect('/version-18/lcc/register-case/04-charges-offence-search')
})




// Add charges - offence search
router.post('/lcc/register-case/04-charges-offence-search', function (req, res) {
    count = req.session.data.chargeCount
    req.session.data.chargeSearch = req.body['charge-search']

    req.session.data.currentResultsId = req.session.data.resultsId
    req.session.data.currentResultsChargeCode = req.session.data.resultsChargeCode
    req.session.data.currentResultsChargeDescription = req.session.data.resultsChargeDescription
    req.session.data.currentResultsStatute = req.session.data.resultsStatute
    req.session.data.currentResultsSection = req.session.data.resultsSection
    req.session.data.currentResultsFromDate = req.session.data.resultsFromDate
    req.session.data.currentResultsToDate = req.session.data.resultsToDate


    if (req.body['charge-search'].includes("Terror") || req.body['charge-search'].includes("terror")) {
        req.session.data.currentResultsId = req.session.data.resultsIdTerrorism
        req.session.data.currentResultsChargeCode = req.session.data.resultsChargeCodeTerrorism
        req.session.data.currentResultsChargeDescription = req.session.data.resultsChargeDescriptionTerrorism
        req.session.data.currentResultsStatute = req.session.data.resultsStatuteTerrorism
        req.session.data.currentResultsSection = req.session.data.resultsSectionTerrorism
        req.session.data.currentResultsFromDate = req.session.data.resultsFromDateTerrorism
        req.session.data.currentResultsToDate = req.session.data.resultsToDateTerrorism
    }
    else if (req.body['charge-search'].includes("CD") || req.body['charge-search'].includes("cd") || 'charge-search'.includes("Criminal") || req.body['charge-search'].includes("criminal") || req.body['charge-search'].includes("arson") || req.body['charge-search'].includes("Arson")) {
        req.session.data.currentResultsId = req.session.data.resultsId
        req.session.data.currentResultsChargeCode = req.session.data.resultsChargeCode
        req.session.data.currentResultsChargeDescription = req.session.data.resultsChargeDescription
        req.session.data.currentResultsStatute = req.session.data.resultsStatute
        req.session.data.currentResultsSection = req.session.data.resultsSection
        req.session.data.currentResultsFromDate = req.session.data.resultsFromDate
        req.session.data.currentResultsToDate = req.session.data.resultsToDate
    }
    else if (req.body['charge-search'].includes("fraud") || req.body['charge-search'].includes("aud") || req.body['charge-search'].includes("Fraud")) {
        req.session.data.currentResultsId = req.session.data.resultsIdFraud
        req.session.data.currentResultsChargeCode = req.session.data.resultsChargeCodeFraud
        req.session.data.currentResultsChargeDescription = req.session.data.resultsChargeDescriptionFraud
        req.session.data.currentResultsStatute = req.session.data.resultsStatuteFraud
        req.session.data.currentResultsSection = req.session.data.resultsSectionFraud
        req.session.data.currentResultsFromDate = req.session.data.resultsFromDateFraud
        req.session.data.currentResultsToDate = req.session.data.resultsToDateFraud
    }


    res.redirect('/version-18/lcc/register-case/04-charges-offence-search-results')
})

// Add charges - offence search results
router.post('/lcc/register-case/04-charges-offence-search-results', function (req, res) {
    count = req.session.data.chargeCount
    req.session.data.chargeCode[count] = req.session.data.currentResultsChargeCode[req.body['add-charge']]
    console.log("req.session.data.chargeCode[count]:", req.session.data.chargeCode[count])
    console.log("Count:", count)
    console.log("req.body['add-charge']:", req.body['add-charge'])

    req.session.data.currentChargeId = req.body['add-charge']

    req.session.data.chargeDescription[count] = req.session.data.currentResultsChargeDescription[req.session.data.currentChargeId]
    console.log("req.session.data.chargeDescription[count]:", req.session.data.chargeDescription[count])

    res.redirect('/version-18/lcc/register-case/04-add-charges')
})


// Add charges 
router.post('/lcc/register-case/04-add-charges', function (req, res) {
    count = req.session.data.chargeCount
    console.log("Charge count:", count)

    req.session.data.chargeId[count] = count
    // console.log("Charge id:",req.session.data.chargeId[count])

    count = Number(req.session.data.chargeCount)

    console.log("Charge count:", count)
    console.log("Current suspect id:", req.session.data.currentSuspectId)

    if (!Array.isArray(req.session.data.chargeVictimYesNo)) {
        req.session.data.chargeVictimYesNo = []
    }

    // If only 1 suspect and first charge
    if (req.session.data.suspectCount === 1) {
        console.log("Only 1 suspect")
        req.session.data.currentSuspectId = 0
        req.session.data.chargeSuspectId[count] = 0
    }

    // req.session.data.chargeCode[count] = req.body['newChargeCode']
    // req.session.data.chargeDescription[count] = req.body['newCharge_Description']
    // Dates
    req.session.data.chargeFromDay[count] = req.body['addCharge_Form_Date-Day']
    req.session.data.chargeFromMonth[count] = req.body['addCharge_Form_Date-Month']
    req.session.data.chargeFromYear[count] = req.body['addCharge_Form_Date-Year']
    req.session.data.chargeToDay[count] = req.body['addCharge_Form_Date-Day_2']
    req.session.data.chargeToMonth[count] = req.body['addCharge_Form_Date-Month_2']
    req.session.data.chargeToYear[count] = req.body['addCharge_Form_Date-Year_2']
    //    req.session.data.chargeComments[count] = req.body['newCharge_Comment']
    req.session.data.chargeVictimYesNo[count] = req.body['newCharge_Victim_YesNo']

    // Victim
    req.session.data.chargeVictimFirstName[count] = req.body['newCharge_Victim_FirstName']
    req.session.data.chargeVictimLastName[count] = req.body['newCharge_Victim_SurnameName']
    req.session.data.chargeVictimVulnerable[count] = ''
    req.session.data.chargeVictimIntimidated[count] = ''
    req.session.data.chargeVictimWitness[count] = ''


    // Offence address
    // req.session.data.offenceAddress1[count] = req.body['addressLine1']
    // req.session.data.offenceAddress2[count] = req.body['addressLine2']
    // req.session.data.offenceTown[count] = req.body['addressTown']
    // req.session.data.offencePostcode[count] = req.body['addressPostcode']
    // req.session.data.offenceCountry[count] = req.body['docType-Country']

    req.session.data.chargedWithAdult[count] = req.body['charged-with-adult']

    console.log("Charge id:", req.session.data.chargeId[count])

    const chargeErrors = {}
    const hasOffenceDate =
        String(req.body['addCharge_Form_Date-Day'] || '').trim() &&
        String(req.body['addCharge_Form_Date-Month'] || '').trim() &&
        String(req.body['addCharge_Form_Date-Year'] || '').trim()

    if (!hasOffenceDate) {
        chargeErrors.offenceDate = 'Enter an offence date that is today or in the past'
    }

    if (!req.body['newCharge_Victim_YesNo']) {
        chargeErrors.victim = 'Select whether there is a victim'
    }

    if (isYouthSuspect(req.session.data, req.session.data.currentSuspectId) && !req.body['charged-with-adult']) {
        chargeErrors.chargedWithAdult = 'Select whether the suspect is charged with an adult'
    }

    if (Object.keys(chargeErrors).length > 0) {
        return res.render('version-18/lcc/register-case/04-add-charges', {
            chargeErrors
        })
    }


    req.session.data.chargeCount = count + 1
    console.log("Charge count 2:", req.session.data.chargeCount)
    // console.log("Grouped:",req.session.data.grouped)

    if (req.body['newCharge_Victim_YesNo'] === 'Yes') {
        res.redirect('/version-18/lcc/register-case/04-add-charges-victim')
    }
    else {
        res.redirect('/version-18/lcc/register-case/04-charges-summary')
    }

})

// Charges victim
router.post('/lcc/register-case/04-add-charges-victim', function (req, res) {
    var count = req.session.data.chargeCount - 1

    req.session.data.chargeVictimVulnerable[count] = ''
    req.session.data.chargeVictimIntimidated[count] = ''
    req.session.data.chargeVictimWitness[count] = ''

    if (req.session.data.victims.length == 1 || req.body['existing-victim'] == 'new-victim') {
        const useNewVictimFields = req.session.data.victims.length > 1

        req.session.data.chargeVictimVulnerable[count] = asChargeVictimFlag(
            useNewVictimFields ? req.body['new-victim-vulnerable'] : req.body['first-victim-vulnerable'],
            'Vulnerable'
        )
        req.session.data.chargeVictimIntimidated[count] = asChargeVictimFlag(
            useNewVictimFields ? req.body['new-victim-intimidated'] : req.body['first-victim-intimidated'],
            'Intimidated'
        )
        req.session.data.chargeVictimWitness[count] = asChargeVictimFlag(
            useNewVictimFields ? req.body['new-victim-witness'] : req.body['first-victim-witness'],
            'Witness'
        )

        req.session.data.chargeVictimId[count] = req.session.data.victims.length
        req.session.data.countVictims = req.session.data.victims.length
        req.session.data.victims.push({
            id: req.session.data.victims.length,
            firstName: req.body['newCharge_Victim_FirstName'],
            lastName: req.body['newCharge_Victim_SurnameName']
        });
    }
    else {
        const selectedVictimId = req.body['existing-victim']

        req.session.data.chargeVictimVulnerable[count] = asChargeVictimFlag(
            req.body[`existing-victim-${selectedVictimId}-vulnerable`],
            'Vulnerable'
        )
        req.session.data.chargeVictimIntimidated[count] = asChargeVictimFlag(
            req.body[`existing-victim-${selectedVictimId}-intimidated`],
            'Intimidated'
        )
        req.session.data.chargeVictimWitness[count] = asChargeVictimFlag(
            req.body[`existing-victim-${selectedVictimId}-witness`],
            'Witness'
        )

        req.session.data.chargeVictimId[count] = req.body['existing-victim']
    }

    console.log("Victims:", req.session.data.victims)
    console.log("Charge victim id:", req.session.data.chargeVictimId[count])

    res.redirect('/version-18/lcc/register-case/04-charges-summary')
})




// Charges summary
router.post('/lcc/register-case/04-charges-summary', function (req, res) {
    const returnTo = getCreateCaseReturnTo(req)
    const addAnother = req.body['add-another-charge']

    if (!addAnother) {
        return res.render('version-18/lcc/register-case/04-charges-summary', {
            grouped: req.session.data.grouped,
            errors: {
                addAnother: 'Select whether you need to add another charge'
            },
            requestBody: req.body,
            errorList: [{
                text: 'Select whether you need to add another charge',
                href: '#add-another'
            }]
        })
    }

    if (addAnother === 'Yes') {
        res.redirect('/version-18/lcc/register-case/04-add-charges-suspect')
    }
    else {
        if (returnTo) {
            return res.redirect('/version-18/lcc/register-case/02-first-hearing-details')
        }

        res.redirect('/version-18/lcc/register-case/02-first-hearing-details')
    }

})

router.get('/lcc/register-case/04-charges-summary', function (req, res) {
    res.render('version-18/lcc/register-case/04-charges-summary', {
        grouped: req.session.data.grouped
    });
})


router.post('/lcc/register-case/remove-charge', function (req, res) {
    req.session.data.removeChargeId = Number(req.body['remove-charge-id'])
    console.log("Remove charge ID:", req.session.data.removeChargeId)
    res.redirect('/version-18/lcc/register-case/04-remove-charge')
})


router.post('/lcc/register-case/04-remove-charge', function (req, res) {
    if (req.body['submit-button'] == 'remove') {
        req.session.data.chargeId.splice(req.session.data.removeChargeId, 1)
        console.log("Charge IDs after removal:", req.session.data.chargeId)
        // req.session.data.chargeSuspectId.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeCode.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeDescription.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeFromDay.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeFromMonth.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeFromYear.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeToDay.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeToMonth.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeToYear.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeComments.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeVictimYesNo.splice(req.session.data.removeChargeId, 1)
        // req.session.data.chargeVictimId.splice(req.session.data.removeChargeId, 1)

        req.session.data.chargeCount = req.session.data.chargeCount - 1

    }

    res.redirect('/version-18/lcc/register-case/04-charges-summary')
})


// ************************************************** End of charges **************************************************



// Complexity 
router.post('/lcc/register-case/05-complexity', function (req, res) {
    req.session.data.caseComplexity = req.body['newCase_Complexity']
    // req.session.data.caseWeight = req.body['newCase_CaseWeight']

    // console.log("Charge suspect IDs:", req.session.data.currentSuspectId)
    // //    let codes = req.session.data.newCase_MonitoringCodes || []


    // req.session.data.preCharge = 'No'

    // const valueToRemove = 'Pre-Charge Decision'

    // req.session.data.newCase_MonitoringCodes = req.session.data.newCase_MonitoringCodes.filter(item => item !== valueToRemove)

    // const suspects = [].concat(req.session.data.suspectId).map(String)
    // const charged = [].concat(req.session.data.chargeSuspectId).map(String)

    // const hasUncharged = suspects.some(id => !charged.includes(id))
    // req.session.data.preCharge = hasUncharged ? 'Yes' : 'No'
    // console.log("hasUncharged:", hasUncharged)
    // //    }

    // console.log("Pre-charge set to (complexity page):", req.session.data.preCharge)
    res.redirect('/version-18/lcc/register-case/08-check-answers')
})


// Monitoring codes
router.post('/lcc/register-case/06-monitoring-codes', function (req, res) {
    res.redirect('/version-18/lcc/register-case/07-cps-staff')
})


// CPS and police staff
router.post('/lcc/register-case/07-cps-staff', function (req, res) {
    console.log("User type:", req.session.data.userType)
    req.session.data.prosecutorCaseworkerYesNo = req.body['prosecutor-caseworker-yes-no']
    req.session.data.prosecutor = req.body['newCase_Prosecutor']
    req.session.data.caseworker = req.body['newCase_Caseworker']
    req.session.data.policeYesNo = req.body['police-yes-no']
    req.session.data.policeRank = req.body['newCase_Police_Rank']
    req.session.data.policeFirstName = req.body['newCase_Police_FirstName']
    req.session.data.policeLastName = req.body['newCase_Police_LastName']
    req.session.data.policeShoulderNumber = req.body['newCase_Police_Number']
    req.session.data.policeUnit = req.body['newCase_Police_Unit']


    res.redirect('/version-18/lcc/register-case/08-check-answers')


    // If user is LCC check if there are materials. If not, go to check your answers.
    // if (req.session.data.userType === 'LCC') {
    //     res.redirect('/version-18/lcc/register-case/07-want-to-create-folders')
    // }
    // else {
    //     res.redirect('/version-18/lcc/register-case/08-check-your-answers') 
    // }    
})


function setRegisterCaseTimestamp(data, key) {
    if (!data[key]) {
        data[key] = new Date().toISOString();
    }
}

function setRegisterCaseRegistered(data) {
    data.createCase_H_Complete = 'true';
    setRegisterCaseTimestamp(data, 'registerCaseRegisteredAt');
}

// Materials
router.post('/lcc/register-case/071-setup-folders', function (req, res) {
    req.session.data.addMaterials = req.body['add-materials']
    if (req.session.data.addMaterials === 'Yes') {
        res.redirect('/version-18/lcc/register-case/10-egress-setup')
    }
    else {
        res.redirect('/version-18/lcc/register-case/08-check-answers')
    }
})

router.get('/lcc/register-case/09-confirmation', function (req, res) {
    res.redirect('/version-18/lcc/register-case/09-case-registered')
})

router.get('/lcc/register-case/09-confirmation.html', function (req, res) {
    res.redirect('/version-18/lcc/register-case/09-case-registered')
})

router.get('/lcc/register-case/09-case-registered', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/09-case-registered')
})

router.get('/lcc/register-case/09-case-registered.html', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/09-case-registered')
})

router.get('/lcc/register-case/10-confirmation', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/10-confirmation')
})

router.get('/lcc/register-case/10-confirmation.html', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/10-confirmation')
})

router.get('/lcc/register-case/12-check-answers', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/12-check-answers')
})

router.get('/lcc/register-case/12-check-answers.html', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/12-check-answers')
})

router.post('/lcc/register-case/12-check-answers', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.redirect('/version-18/lcc/register-case/12-confirmation')
})

router.get('/lcc/register-case/12-confirmation', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/12-confirmation')
})

router.get('/lcc/register-case/12-confirmation.html', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    res.render('version-18/lcc/register-case/12-confirmation')
})

router.get('/lcc/register-case/create-both-confirmation', function (req, res) {
    res.redirect('/version-18/lcc/register-case/12-confirmation')
})

router.get('/lcc/register-case/connect-both-confirmation', function (req, res) {
    res.redirect('/version-18/lcc/register-case/12-confirmation')
})

router.post('/lcc/register-case/09-confirmation', function (req, res) {
    res.redirect(307, '/version-18/lcc/register-case/09-case-registered')
})

router.post('/lcc/register-case/09-case-registered', function (req, res) {
    setRegisterCaseRegistered(req.session.data)
    req.session.data.addMaterials = req.body['add-materials']

    if (req.session.data.addMaterials === 'Yes') {
        res.redirect('/version-18/lcc/register-case/10-egress-setup')
    }
    else {
        res.redirect('/version-18/lcc/register-case/10-confirmation')
    }
})

function redirectRegisterCaseMaterialsConfirmation(req, res) {
    if (req.session.data.newEgressFolder === 1 || req.session.data.existingEgressFolder === 1 || req.session.data.newDriveFolder === 1 || req.session.data.existingDriveFolder === 1) {
        res.redirect('/version-18/lcc/register-case/12-check-answers')
    }
    else {
        res.redirect('/version-18/lcc/register-case/10-confirmation')
    }
}

router.post('/lcc/register-case/10-egress-setup', function (req, res) {
    req.session.data.newEgressFolder = 0
    req.session.data.existingEgressFolder = 0
    req.session.data.egress_file_link = ''

    if (req.body['egress-folder-options'] === 'Create new Egress folders') {
        req.session.data.newEgressFolder = 1
        setRegisterCaseTimestamp(req.session.data, 'registerCaseEgressCreatedAt')
        res.redirect('/version-18/lcc/register-case/10-egress-confirmation')
    }
    else if (req.body['egress-folder-options'] === 'Connect Egress folders') {
        req.session.data.existingEgressFolder = 1
        res.redirect('/version-18/lcc/register-case/10-egress-files')
    }
    else {
        res.redirect('/version-18/lcc/register-case/11-shared-drive-setup')
    }
})

router.post('/lcc/register-case/10-create-egress-folder', function (req, res) {
    req.session.data.egressTemplate = req.body['egress-template']
    setRegisterCaseTimestamp(req.session.data, 'registerCaseEgressCreatedAt')
    res.redirect('/version-18/lcc/register-case/10-egress-confirmation')
})

router.post('/lcc/register-case/10-egress-files-connected', function (req, res) {
    req.session.data.egress_file_link = req.body.egress_file_link
    setRegisterCaseTimestamp(req.session.data, 'registerCaseEgressLinkedAt')
    res.redirect('/version-18/lcc/register-case/10-egress-confirmation')
})

router.post('/lcc/register-case/10-egress-confirmation', function (req, res) {
    res.redirect('/version-18/lcc/register-case/11-shared-drive-setup')
})

router.post('/lcc/register-case/11-shared-drive-setup', function (req, res) {
    req.session.data.newDriveFolder = 0
    req.session.data.existingDriveFolder = 0
    req.session.data.pdrive_file_link = ''

    if (req.body['shared-drive-folder-options'] === 'Create new Shared Drive folders') {
        req.session.data.newDriveFolder = 1
        res.redirect('/version-18/lcc/register-case/11-create-shared-drive-folder')
    }
    else if (req.body['shared-drive-folder-options'] === 'Connect Shared Drive folders') {
        req.session.data.existingDriveFolder = 1
        res.redirect('/version-18/lcc/register-case/11-shared-drive-files')
    }
    else {
        redirectRegisterCaseMaterialsConfirmation(req, res)
    }
})

router.post('/lcc/register-case/11-create-shared-drive-folder', function (req, res) {
    req.session.data.sharedDriveTemplate = req.body['shared-drive-template']
    setRegisterCaseTimestamp(req.session.data, 'registerCaseSharedDriveCreatedAt')
    redirectRegisterCaseMaterialsConfirmation(req, res)
})

router.post('/lcc/register-case/11-shared-drive-files-connected', function (req, res) {
    req.session.data.pdrive_file_link = req.body.pdrive_file_link
    setRegisterCaseTimestamp(req.session.data, 'registerCaseSharedDriveLinkedAt')
    redirectRegisterCaseMaterialsConfirmation(req, res)
})

router.get('/lcc/register-case/case-details-placeholder', function (req, res) {
    res.redirect('/version-18/lcc/register-case/08-check-answers')
})

router.post('/lcc/register-case/case-details-placeholder', function (req, res) {
    res.redirect('/version-18/lcc/register-case/08-check-answers')
})


router.get('/lcc/materials/04A-create-or-link-folders', function (req, res) {
    res.redirect('/version-18/lcc/materials/04A-egress-files')
})

router.post('/lcc/materials/04A-create-or-link-folders', function (req, res) {
    req.session.data.newEgressFolder = 0
    req.session.data.newDriveFolder = 0
    req.session.data.existingEgressFolder = 1
    req.session.data.existingDriveFolder = 1
    res.redirect('/version-18/lcc/materials/04A-egress-files')
})

router.post('/lcc/materials/05A-create-shared-drive-folder', function (req, res) {
    req.session.data.sharedDriveTemplate = req.body['shared-drive-template']
    setRegisterCaseTimestamp(req.session.data, 'registerCaseSharedDriveCreatedAt')
    res.redirect('/version-18/lcc/register-case/12-check-answers')
})

router.get('/lcc/materials/04A-egress-files', function (req, res) {
    const searchedCaseName = req.query.searchOFF_EGRESS_VALUE || req.query.searchOFF_Operation_VALUE || req.query.searchOFF_Defendant_VALUE || req.query.searchOFF_URN_VALUE || req.session.data.searchOFF_Operation_VALUE || req.session.data.searchOFF_Defendant_VALUE || req.session.data.searchOFF_URN_VALUE
    if (searchedCaseName) req.session.data.connectionCaseSearchTerm = searchedCaseName
    if (req.query.searchOFF_URN_VALUE || req.query.searchOFF === 'URN') {
        req.session.data.connectionSearchType = 'urn'
    }
    else if (req.query.searchOFF_Operation_VALUE || req.query.searchOFF === 'Operation name') {
        req.session.data.connectionSearchType = 'operation'
    }
    else if (req.query.searchOFF_Defendant_VALUE || req.query.searchOFF === 'Defendant surname') {
        req.session.data.connectionSearchType = 'defendant'
    }
    res.render('version-18/lcc/materials/connect-egress', {
        connectionJourney: 'materials'
    })
})

router.post('/lcc/materials/04A-egress-files', function (req, res) {
    const searchedCaseName = req.body.searchOFF_Operation_VALUE || req.body.searchOFF_Defendant_VALUE || req.body.searchOFF_URN_VALUE || req.session.data.searchOFF_Operation_VALUE || req.session.data.searchOFF_Defendant_VALUE || req.session.data.searchOFF_URN_VALUE
    if (searchedCaseName) req.session.data.connectionCaseSearchTerm = searchedCaseName
    if (req.body.searchOFF_URN_VALUE || req.body.searchOFF === 'URN') {
        req.session.data.connectionSearchType = 'urn'
    }
    else if (req.body.searchOFF_Operation_VALUE || req.body.searchOFF === 'Operation name') {
        req.session.data.connectionSearchType = 'operation'
    }
    else if (req.body.searchOFF_Defendant_VALUE || req.body.searchOFF === 'Defendant surname') {
        req.session.data.connectionSearchType = 'defendant'
    }
    res.render('version-18/lcc/materials/connect-egress', {
        connectionJourney: 'materials'
    })
})

router.get('/lcc/materials/05A-p-drive-files', function (req, res) {
    res.render('version-18/lcc/materials/connect-shared-drive', {
        connectionJourney: 'materials'
    })
})

router.post('/lcc/materials/05A-p-drive-files', function (req, res) {
    res.render('version-18/lcc/materials/connect-shared-drive', {
        connectionJourney: 'materials'
    })
})

router.post('/lcc/materials/04A-egress-files-connected', function (req, res) {
    req.session.data.egress_file_link = req.body.egress_file_link
    req.session.data.existingEgressFolder = 1
    req.session.data.offCMS_Egress_files_V2 = 'Yes'
    setRegisterCaseTimestamp(req.session.data, 'registerCaseEgressLinkedAt')
    res.redirect('/version-18/lcc/materials/05A-p-drive-files')
})

router.post('/lcc/materials/05A-p-drive-files-connected', function (req, res) {
    req.session.data.pdrive_file_link = req.body.pdrive_file_link
    req.session.data.existingDriveFolder = 1
    req.session.data.offCMS_PDrive_files_V2 = 'Yes'
    setRegisterCaseTimestamp(req.session.data, 'registerCaseSharedDriveLinkedAt')
    res.redirect('/version-18/lcc/materials/03-case-overview?activeTab=tab-1-content')
})

router.post('/lcc/materials/05A-create-shared-drive-folder', function (req, res) {
    req.session.data.sharedDriveTemplate = req.body['shared-drive-template']
    setRegisterCaseTimestamp(req.session.data, 'registerCaseSharedDriveCreatedAt')
    res.redirect('/version-18/lcc/register-case/08-check-answers')
})

router.post('/lcc/materials/04A-egress-files-connected', function (req, res) {
    setRegisterCaseTimestamp(req.session.data, 'registerCaseEgressLinkedAt')
    if (req.session.data.newDriveFolder === 1) {
        res.redirect('/version-18/lcc/materials/05A-create-shared-drive-folder')
    }
    else if (req.session.data.existingDriveFolder === 1) {
        res.redirect('/version-18/lcc/materials/05A-p-drive-files')
    }
    else {
        res.redirect('/version-18/lcc/register-case/08-check-answers')
    }
})

router.post('/lcc/materials/05A-p-drive-files-connected', function (req, res) {
    setRegisterCaseTimestamp(req.session.data, 'registerCaseSharedDriveLinkedAt')
    res.redirect('/version-18/lcc/register-case/08-check-answers')
})



router.post('/lcc/materials/04A-create-egress-folder', function (req, res) {
    req.session.data.egressTemplate = req.body['egress-template']
    setRegisterCaseTimestamp(req.session.data, 'registerCaseEgressCreatedAt')

    if (req.session.data.newDriveFolder === 1) {
        res.redirect('/version-18/lcc/materials/05A-create-shared-drive-folder')
    }
    else if (req.session.data.existingDriveFolder === 1) {
        res.redirect('/version-18/lcc/materials/05A-p-drive-files')
    }
    else {
        res.redirect('/version-18/lcc/register-case/12-check-answers')
    }

})
// End of materials






// ********************** Materials ********************** //

// Handle materials filter POST
// router.post('/includes/materials/materials-filter', function(req, res) {
//     req.session.data.filterNew = req.body['filterNew']
//     req.session.data.filterStatusUsed = req.body['filterStatusUsed']
//     req.session.data.filterStatusUnused = req.body['filterStatusUnused']
//     req.session.data.filterStatusNone = req.body['filterStatusNone']
//     req.session.data.filtersSearch = req.body['filtersSearch']

// //   req.session.data.filterCategoryReview = req.body['filterCategoryReview']
// //   req.session.data.filterCategoryCaseOverview = req.body['filterCategoryCaseOverview']
// //   req.session.data.filterCategoryStatements = req.body['filterCategoryStatements']
// //   req.session.data.filterCategoryExhibits = req.body['filterCategoryExhibits']
// //   req.session.data.filterCategoryForensics = req.body['filterCategoryForensics']
// //   req.session.data.filterCategoryUnusedMaterial = req.body['filterCategoryUnusedMaterial']
// //   req.session.data.filterCategoryDefendant = req.body['filterCategoryDefendant']
// //   req.session.data.filterCategoryCourtPreparation = req.body['filterCategoryCourtPreparation']
//     if (req.session.data.filtersSearch != "") {
//         console.log("Search term:", req.body['filtersSearch'] )
//     }

// //   console.log("Filter data:", req.session.data)
//     res.redirect('/version-18/lcc/materials/03-case-overview')
// })


// Handle materials filter POST
router.post('/includes/materials/materials-filter', function (req, res) {

    const data = req.session.data;
    const body = req.body;

    // ----------------------------
    // STATUS CHECKBOXES (multi-select)
    // ----------------------------
    data.filterStatusUsed = body.filterStatusUsed ? 'Used' : '';
    data.filterStatusUnused = body.filterStatusUnused ? 'Unused' : '';
    data.filterStatusNone = body.filterStatusNone ? 'None' : '';

    // ----------------------------
    // SEARCH TERM + CLEAR SEARCH
    // ----------------------------
    if (body.clearSearch === 'x') {
        // user clicked the × button
        data.filtersSearch = '';
    } else if (typeof body.filtersSearch === 'string') {
        data.filtersSearch = body.filtersSearch.trim();
    }

    const materials = data.materials || [];
    const search = (data.filtersSearch || "").trim().toLowerCase();
    const sharedDriveRootLabel = getSharedDriveRootLabel(data);

    // -------------------------------------------------------------------
    // Build grouped search results (MATCHES BOTH FOLDERS AND FILES)
    // (unchanged logic, just moved into a helper function here)
    // -------------------------------------------------------------------
    function buildGroupedSearchResults(materials, search) {

        if (!search) return [];

        const groups = {};

        function getFolderPath(materials, folderId) {
            // Build "Shared Drive: [case name] > Case management > Police" etc
            const parts = [];
            let currentId = folderId;

            // prevent infinite loops if data gets weird
            const seen = new Set();

            while (currentId && !seen.has(String(currentId))) {
                seen.add(String(currentId));

                const folder = materials.find(m => String(m.id) === String(currentId) && m.folder);
                if (!folder) break;

                parts.unshift(folder.name);
                currentId = folder.parentId;
            }

            // Choose your preferred "root" label
            return parts.length ? `${sharedDriveRootLabel} > ${parts.join(' > ')}` : sharedDriveRootLabel;
        }

        materials.forEach(item => {
            const itemName = (item.name || "").toString().trim().toLowerCase();
            const searchMatches = itemName.includes(search);

            // ----------- MATCHED FILE -----------
            if (!item.folder && searchMatches) {
                const folderId = item.parentId;

                if (!groups[folderId]) {
                    groups[folderId] = {
                        folder: materials.find(m => m.id === folderId && m.folder) || null,
                        matchesFolder: false,
                        files: []
                    };
                }

                groups[folderId].files.push({
                    ...item,
                    folderPath: getFolderPath(materials, folderId)
                });
            }

            // ----------- MATCHED FOLDER NAME -----------
            if (item.folder && searchMatches) {
                const folderId = item.id;

                if (!groups[folderId]) {
                    groups[folderId] = {
                        folder: item,
                        matchesFolder: true,
                        files: []
                    };
                } else {
                    groups[folderId].matchesFolder = true;
                }
            }
        });

        // CLEAN-UP RULE:
        // If a folder has NO matching files and matchesFolder=false,
        // do not include it.
        return Object.values(groups).filter(g =>
            g.matchesFolder || g.files.length > 0
        );
    }

    // Store results in session (used by materials-search-grouped.html)
    data.groupedSearchResults = buildGroupedSearchResults(materials, search);

    console.log("Grouped search results:");
    console.dir(data.groupedSearchResults, { depth: null });

    // Back to case overview, where GET will apply filters + search
    res.redirect('/version-18/lcc/materials/03-case-overview');
});


// AI //

const createMaterialsUtils = require('../../helpers/materials.js');

function getActivityActor(data) {
    return {
        name: data['offCMS_Username'] || 'dwight_schrute',
        email: data['urUser'] || 'usability.testing.session@test.gov.uk'
    };
}

function formatActivityTimestamp(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const time = date.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).toLowerCase().replace(' ', '');

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isToday) return `Today at ${time}`;
    if (isYesterday) return `yesterday at ${time}`;

    const day = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `${day} at ${time}`;
}

function getMaterialsCaseName(data = {}) {
    return trimString(data.operationName) || 'Thundercat';
}

function getSharedDriveRootLabel(data = {}) {
    return `Shared Drive: ${getMaterialsCaseName(data)}`;
}

function getEgressRootLabel(data = {}) {
    return `Egress: ${getMaterialsCaseName(data)}`;
}

function getFolderPathLabel(materials, folderId, data = {}) {
    const parts = [];
    let currentId = folderId;
    const seen = new Set();
    const rootLabel = getSharedDriveRootLabel(data);

    while (currentId !== null && currentId !== undefined && !seen.has(String(currentId))) {
        seen.add(String(currentId));
        const folder = materials.find(m => m && m.folder && String(m.id) === String(currentId));
        if (!folder) break;
        parts.unshift(folder.name);
        currentId = folder.parentId;
    }

    return parts.length ? `${rootLabel} > ${parts.join(' > ')}` : rootLabel;
}

function getItemPathLabel(materials, item, nameOverride, data = {}) {
    const parentPath = getFolderPathLabel(materials, item.parentId, data);
    const itemName = nameOverride || item.name || 'Unnamed item';
    return `${parentPath} > ${itemName}`;
}

function createBaseActivityEntry(data) {
    const actor = getActivityActor(data);
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        byName: '',
        byEmail: actor.email,
        dateLabel: formatActivityTimestamp(new Date())
    };
}

function pushMaterialsActivity(data, entry) {
    data.materialsActivityLog = data.materialsActivityLog || [];
    const title = String(entry.title || '').toLowerCase();
    const isSuccessfulActivity = [
        'copied',
        'renamed',
        'moved',
        'deleted',
        'connected',
        'disconnected'
    ].some(action => title.includes(action)) && !title.includes('not ');

    data.materialsActivityLog.unshift({
        ...createBaseActivityEntry(data),
        ...(isSuccessfulActivity && !entry.statusTag ? { statusTag: 'Completed' } : {}),
        ...entry
    });
}

function getRegisterCaseActivity(data = {}) {
    const hasRegisteredCase = data.createCase_H_Complete === 'true' || data.createCase_H_Complete === true;
    if (!hasRegisteredCase) {
        return {
            entries: [],
            lastUpdatedLabel: ''
        };
    }

    setRegisterCaseTimestamp(data, 'registerCaseRegisteredAt');
    const registerCaseActor = data.urUser;

    const registeredEntry = {
        title: 'Case registered',
        timestamp: data.registerCaseRegisteredAt,
        dateLabel: formatActivityTimestamp(data.registerCaseRegisteredAt),
        byEmail: registerCaseActor
    };

    const folderEntries = [];

    if (data.registerCaseEgressCreatedAt) {
        folderEntries.push({
            title: 'Egress created for case',
            timestamp: data.registerCaseEgressCreatedAt,
            dateLabel: formatActivityTimestamp(data.registerCaseEgressCreatedAt),
            byEmail: registerCaseActor
        });
    }

    if (data.registerCaseSharedDriveCreatedAt) {
        folderEntries.push({
            title: 'Shared Drive folder created for case',
            timestamp: data.registerCaseSharedDriveCreatedAt,
            dateLabel: formatActivityTimestamp(data.registerCaseSharedDriveCreatedAt),
            byEmail: registerCaseActor
        });
    }

    if (data.registerCaseEgressLinkedAt) {
        folderEntries.push({
            title: 'Egress linked to case',
            timestamp: data.registerCaseEgressLinkedAt,
            dateLabel: formatActivityTimestamp(data.registerCaseEgressLinkedAt),
            byEmail: registerCaseActor
        });
    }

    if (data.registerCaseSharedDriveLinkedAt) {
        folderEntries.push({
            title: 'Shared Drive folder linked to case',
            timestamp: data.registerCaseSharedDriveLinkedAt,
            dateLabel: formatActivityTimestamp(data.registerCaseSharedDriveLinkedAt),
            byEmail: registerCaseActor
        });
    }

    folderEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const entries = [...folderEntries, registeredEntry];

    return {
        entries,
        lastUpdatedLabel: entries.length ? entries[0].dateLabel : ''
    };
}


function renderCaseOverviewPage(pageView, activeTab) {
    return function (req, res) {
    const data = req.session.data;
    const registerCaseActivity = getRegisterCaseActivity(data);
    const sharedDriveRootLabel = getSharedDriveRootLabel(data);
    const egressRootLabel = getEgressRootLabel(data);
    const materials = data.materials || [];
    const pageSizeOptions = [20, 50, 100];
    const validTransferViews = ['egress', 'shared-drive'];
    const validDeleteVariants = ['regular', 'tree', 'large', 'paginated'];
    req.session.data.activeTab = activeTab;
    if (validDeleteVariants.includes(req.query.deleteVariant)) {
        req.session.data.deleteVariant = req.query.deleteVariant;
    }
    if (validTransferViews.includes(req.query.transferView)) {
        req.session.data.transferView = req.query.transferView;
    }
    if (req.query.transferSharedDriveFolderId !== undefined) {
        req.session.data.transferSharedDriveFolderId = Number(req.query.transferSharedDriveFolderId) || 0;
    }
    if (req.query.transferEgressFolderId !== undefined) {
        req.session.data.transferEgressFolderId = Number(req.query.transferEgressFolderId) || 100;
    }
    if (req.query.retryFailedTransfer === '1') {
        req.session.data.transferEgressRetryAttempt = true;
        req.session.data.transferEgressRetryFailedAlert = true;
        if (!Array.isArray(req.session.data.transferEgressRetryItems) || req.session.data.transferEgressRetryItems.length === 0) {
            const retryFailureIds = new Set(['120', '121', '122', '123', '124', '125', '126']);
            req.session.data.transferEgressRetryItems = (req.session.data.transferEgress || [])
                .filter(item => retryFailureIds.has(String(item.id)))
                .map(item => item.name);
        }
    }

    function normalisePageSize(value) {
        const parsed = Number(value);
        return pageSizeOptions.includes(parsed) ? parsed : 20;
    }

    function buildPaginationItems(currentPage, totalPages) {
        if (totalPages <= 10) {
            return Array.from({ length: totalPages }, (_, index) => ({
                number: index + 1,
                ellipsis: false
            }));
        }

        const items = [];
        const pages = new Set([
            1,
            2,
            totalPages - 1,
            totalPages,
            currentPage - 1,
            currentPage,
            currentPage + 1
        ]);

        const sortedPages = Array.from(pages)
            .filter(page => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b);

        sortedPages.forEach((page, index) => {
            if (index > 0 && page - sortedPages[index - 1] > 1) {
                items.push({ ellipsis: true });
            }

            items.push({
                number: page,
                ellipsis: false
            });
        });

        return items;
    }

    function paginateItems(items, currentPage, pageSize) {
        const totalItems = items.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const page = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages);
        const startIndex = (page - 1) * pageSize;

        return {
            items: items.slice(startIndex, startIndex + pageSize),
            page,
            pageSize,
            totalItems,
            totalPages,
            pageItems: buildPaginationItems(page, totalPages),
            startItem: totalItems === 0 ? 0 : startIndex + 1,
            endItem: Math.min(startIndex + pageSize, totalItems),
            showPagination: totalItems > 20
        };
    }

    const transferEgressData = (
        Array.isArray(data.transferEgress)
            ? data.transferEgress
            : res.locals.data.transferEgress
    ) || [];

    function getTransferEgressChildren(folderId) {
        return transferEgressData.filter(item => Number(item.parentId) === Number(folderId));
    }

    function getTransferEgressBreadcrumbs(folderId) {
        const rootCrumb = { id: 100, name: egressRootLabel };
        const crumbs = [];
        let currentId = Number(folderId);

        while (currentId && currentId !== 100) {
            const folder = transferEgressData.find(item => Number(item.id) === currentId && item.folder);
            if (!folder) break;
            crumbs.unshift({ id: folder.id, name: folder.name });
            currentId = Number(folder.parentId);
        }

        return [rootCrumb, ...crumbs];
    }

    // ✅ Seed default "last ordered" metadata (prototype baseline)
    data.orderMeta = data.orderMeta || {};

    // Only seed if it's not already set (so user actions can overwrite it)
    if (!data.orderMeta["1007"]) {
        data.orderMeta["1007"] = {
            person: "Roxanne Rowe",
            date: "12 January 2026"
        };
    }

    const lastRenamedId = String(data.lastRenamedId || '');
    const flashRenamedId = String(data.flashRenamedId || '');
    req.session.data.flashRenamedId = '';

    const flashNewFolderId = String(data.flashNewFolderId || '');
    req.session.data.flashNewFolderId = '';

    // Clear renamed flags from previous renders
    materials.forEach(m => {
        if (m.renamed && m.id !== lastRenamedId) {
            delete m.renamed;
        }
    });

    // Extract flags + lists for THIS render only
    const copySuccess = data.copySuccess === true;
    const moveSuccess = data.moveSuccess === true;
    const deleteSuccess = data.deleteSuccess === true;

    const copyList = data.copyList || [];
    const moveList = data.moveList || [];

    const copyDestinationName = data.copyDestinationName || null;
    const moveDestinationName = data.moveDestinationName || null;

    const copyPreviewTree = data.copyPreviewTree || [];
    const movePreviewTree = data.movePreviewTree || [];
    const deletePreviewTree = data.deletePreviewTree || [];
    const renameBlockedLoadingName = data.renameBlockedLoadingName || '';
    const copyConflictLoading = data.copyConflictLoading === true;
    const copyConflictPending = data.copyConflictPending === true;
    const copyConflictMessage = data.copyConflictMessage || null;
    const copyConflictItems = data.copyConflictItems || [];
    const moveConflictLoading = data.moveConflictLoading === true;
    const moveConflictPending = data.moveConflictPending === true;
    const moveConflictMessage = data.moveConflictMessage || null;
    const moveConflictItems = data.moveConflictItems || [];

    const copyDestinationId = data.copyDestinationId || 0;
    const moveDestinationId = data.moveDestinationId || 0;
    const preserveCopyFlash = copyConflictLoading;
    const preserveMoveFlash = moveConflictLoading;

    // Immediately reset so they only show once
    if (!preserveCopyFlash) {
        req.session.data.copySuccess = false;
        req.session.data.copyList = [];
        req.session.data.copyDestinationName = null;
        req.session.data.copyDestinationId = null;
        req.session.data.copyPreviewTree = [];
    }
    if (!preserveMoveFlash) {
        req.session.data.moveSuccess = false;
        req.session.data.moveList = [];
        req.session.data.moveDestinationName = null;
        req.session.data.moveDestinationId = null;
        req.session.data.movePreviewTree = [];
    }
    req.session.data.deleteSuccess = false;
    req.session.data.deletePreviewTree = [];
    req.session.data.renameBlockedLoadingName = '';
    req.session.data.copyConflictLoading = false;
    req.session.data.copyConflictPending = false;
    if (copyConflictPending) {
        req.session.data.copyConflictMessage = null;
        req.session.data.copyConflictItems = [];
    }
    req.session.data.moveConflictLoading = false;
    req.session.data.moveConflictPending = false;
    if (moveConflictPending) {
        req.session.data.moveConflictMessage = null;
        req.session.data.moveConflictItems = [];
    }

    // Helper utils
    const utils = createMaterialsUtils(materials);

    // Current folder
    const folderId = Number(data.folderId ?? 0);
    const transferSharedDriveFolderId = Number(data.transferSharedDriveFolderId ?? 0);
    const transferSharedDriveItems = utils.getChildren(transferSharedDriveFolderId);
    const transferSharedDriveBreadcrumbs = utils.getBreadcrumbs(transferSharedDriveFolderId).map(crumb => (
        Number(crumb.id) === 0 ? { ...crumb, name: sharedDriveRootLabel } : crumb
    ));
    const transferEgressFolderId = Number(data.transferEgressFolderId ?? 100);
    const transferEgressItems = getTransferEgressChildren(transferEgressFolderId);
    const transferEgressBreadcrumbs = getTransferEgressBreadcrumbs(transferEgressFolderId);

    // ================================
    // 1. Get the raw children of this folder
    // ================================
    let children = utils.getChildren(folderId);

    // ================================
    // 2. Apply filters
    // ================================
    const filters = {
        used: data.filterStatusUsed ? true : false,
        unused: data.filterStatusUnused ? true : false,
        none: data.filterStatusNone ? true : false
    };

    // -------------------------
    // STATUS MULTI-SELECT
    // -------------------------

    const statusFilters = [];

    if (filters.used) statusFilters.push("Used");
    if (filters.unused) statusFilters.push("Unused");
    if (filters.none) statusFilters.push("None");

    if (statusFilters.length > 0) {
        children = children.filter(m => statusFilters.includes(m.status));
    }
    // Breadcrumbs unaffected
    const breadcrumbs = utils.getBreadcrumbs(folderId).map(crumb => (
        Number(crumb.id) === 0 ? { ...crumb, name: sharedDriveRootLabel } : crumb
    ));


    // ================================
    // 4. If search term exists, rebuild groupedSearchResults fresh
    // ================================
    const search = (data.filtersSearch || "").trim().toLowerCase();

    // function buildGroupedSearchResults(materials, search) {
    //     if (!search) return [];

    //     const groups = {};

    //     materials.forEach(item => {
    //         if (!item) return;
    //         const itemName = (item.name || "").toString().trim().toLowerCase();
    //         const searchMatches = itemName.includes(search);

    //         // Matched FILE
    //         if (!item.folder && searchMatches) {
    //             const folderId = item.parentId ?? null;

    //             if (!groups[folderId]) {
    //                 groups[folderId] = {
    //                     folder: materials.find(m => m && m.id === folderId && m.folder) || null,
    //                     matchesFolder: false,
    //                     files: []
    //                 };
    //             }

    //             groups[folderId].files.push(item);
    //         }

    //         // Matched FOLDER NAME
    //         if (item.folder && searchMatches) {
    //             const folderId = item.id;

    //             if (!groups[folderId]) {
    //                 groups[folderId] = {
    //                     folder: item,
    //                     matchesFolder: true,
    //                     files: []
    //                 };
    //             } else {
    //                 groups[folderId].folder = item;
    //                 groups[folderId].matchesFolder = true;
    //             }
    //         }
    //     });

    //     // Convert map to array; remove empty entries
    //     return Object.values(groups).filter(g => g.folder || (g.files && g.files.length));
    // }

    function getFolderPath(materials, folderId) {
        const parts = [];
        let currentId = folderId;
        const seen = new Set();

        while (currentId !== null && currentId !== undefined && !seen.has(String(currentId))) {
            seen.add(String(currentId));

            const folder = materials.find(m => m && m.folder && String(m.id) === String(currentId));
            if (!folder) break;

            parts.unshift(folder.name);
            currentId = folder.parentId;
        }

        return parts.length ? `${sharedDriveRootLabel} > ${parts.join(' > ')}` : sharedDriveRootLabel;
    }

    function buildGroupedSearchResults(materials, search) {
        if (!search) return [];

        const groups = {};

        materials.forEach(item => {
            if (!item) return;

            const itemName = (item.name || "").toString().trim().toLowerCase();
            const searchMatches = itemName.includes(search);

            // Matched FILE
            if (!item.folder && searchMatches) {
                const folderId = item.parentId ?? null;

                if (!groups[folderId]) {
                    groups[folderId] = {
                        folder: materials.find(m => m && m.folder && String(m.id) === String(folderId)) || null,
                        matchesFolder: false,
                        files: []
                    };
                }

                groups[folderId].files.push({
                    ...item,
                    folderPath: getFolderPath(materials, folderId)
                });
            }

            // Matched FOLDER NAME
            if (item.folder && searchMatches) {
                const folderId = item.id;

                const enrichedFolder = {
                    ...item,
                    folderPath: getFolderPath(materials, item.parentId)
                };

                if (!groups[folderId]) {
                    groups[folderId] = {
                        folder: enrichedFolder,
                        matchesFolder: true,
                        files: []
                    };
                } else {
                    groups[folderId].folder = enrichedFolder;
                    groups[folderId].matchesFolder = true;
                }
            }
        });

        return Object.values(groups).filter(g => g.folder || (g.files && g.files.length));
    }

    const groupedSearchResults = buildGroupedSearchResults(materials, search);

    function countGroupedSearchResultItems(groups) {
        return groups.reduce((total, group) => {
            if (!group) return total;
            return total + (group.matchesFolder ? 1 : 0) + ((group.files && group.files.length) || 0);
        }, 0);
    }

    function flattenGroupedSearchResults(groups) {
        const rows = [];

        groups.forEach(group => {
            if (!group) return;

            if (group.matchesFolder) {
                rows.push({
                    type: 'folder',
                    groupKey: group.folder ? group.folder.id : `folder-${rows.length}`,
                    folder: group.folder
                });
            }

            (group.files || []).forEach(file => {
                rows.push({
                    type: 'file',
                    groupKey: group.folder ? group.folder.id : `root-${file.id}`,
                    folder: group.folder,
                    file
                });
            });
        });

        return rows;
    }

    function regroupPaginatedSearchRows(rows) {
        const groups = [];
        const groupIndex = {};

        rows.forEach(row => {
            const key = String(row.groupKey);

            if (!groupIndex[key]) {
                groupIndex[key] = {
                    folder: row.folder || null,
                    matchesFolder: false,
                    files: []
                };
                groups.push(groupIndex[key]);
            }

            if (row.type === 'folder') {
                groupIndex[key].folder = row.folder || groupIndex[key].folder;
                groupIndex[key].matchesFolder = true;
            }

            if (row.type === 'file') {
                groupIndex[key].folder = row.folder || groupIndex[key].folder;
                groupIndex[key].files.push(row.file);
            }
        });

        return groups.filter(group => group.matchesFolder || group.files.length > 0);
    }

    const pageSize = normalisePageSize(req.query.pageSize || data.manageMaterialsPageSize);
    const page = Number(req.query.page) || 1;

    req.session.data.manageMaterialsPageSize = pageSize;

    let pagination;
    let paginatedGroupedSearchResults = groupedSearchResults;
    let totalDisplayItems;

    if (search) {
        const totalSearchItems = countGroupedSearchResultItems(groupedSearchResults);
        const flattenedGroupedSearchResults = flattenGroupedSearchResults(groupedSearchResults);
        const searchPagination = paginateItems(flattenedGroupedSearchResults, page, pageSize);

        pagination = {
            ...searchPagination,
            totalItems: totalSearchItems,
            totalPages: Math.max(1, Math.ceil(totalSearchItems / pageSize)),
            page: Math.min(Math.max(Number(page) || 1, 1), Math.max(1, Math.ceil(totalSearchItems / pageSize))),
            pageItems: buildPaginationItems(
                Math.min(Math.max(Number(page) || 1, 1), Math.max(1, Math.ceil(totalSearchItems / pageSize))),
                Math.max(1, Math.ceil(totalSearchItems / pageSize))
            ),
            startItem: totalSearchItems === 0 ? 0 : ((Math.min(Math.max(Number(page) || 1, 1), Math.max(1, Math.ceil(totalSearchItems / pageSize))) - 1) * pageSize) + 1,
            endItem: Math.min(((Math.min(Math.max(Number(page) || 1, 1), Math.max(1, Math.ceil(totalSearchItems / pageSize))) - 1) * pageSize) + pageSize, totalSearchItems),
            showPagination: totalSearchItems > 20
        };

        paginatedGroupedSearchResults = regroupPaginatedSearchRows(searchPagination.items);
        totalDisplayItems = totalSearchItems;
    } else {
        pagination = paginateItems(children, page, pageSize);
        totalDisplayItems = children.length;
    }

    // Prevent browser caching (fixes stale search results after rename)
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    // ================================
    // 3. Render page with filtered children
    // ================================
    res.render(`version-18/lcc/materials/${pageView}`, {
        materials,
        data,
        children: search ? children : pagination.items,
        breadcrumbs,
        groupedSearchResults: search ? paginatedGroupedSearchResults : groupedSearchResults,
        pagination,
        pageSizeOptions,
        totalDisplayItems,
        flashRenamedId,
        flashNewFolderId,
        copySuccess,
        moveSuccess,
        deleteSuccess,
        copyList,
        moveList,
        copyDestinationName,
        moveDestinationName,
        copyPreviewTree,
        movePreviewTree,
        deletePreviewTree,
        renameBlockedLoadingName,
        copyConflictLoading,
        copyConflictPending,
        copyConflictMessage,
        copyConflictItems,
        moveConflictLoading,
        moveConflictPending,
        moveConflictMessage,
        moveConflictItems,
        copyDestinationId,
        moveDestinationId,
        transferSharedDriveFolderId,
        transferSharedDriveItems,
        transferSharedDriveBreadcrumbs,
        transferEgressFolderId,
        transferEgressItems,
        transferEgressBreadcrumbs,
        registerCaseActivity
    });

    req.session.data.lastRenamedId = null;
    req.session.data.transferEgressCopySuccess = false;
    req.session.data.transferEgressMoveSuccess = false;
    req.session.data.transferEgressPartialSuccess = false;
    req.session.data.transferEgressConflictItems = [];
    req.session.data.transferEgressList = [];
    req.session.data.transferEgressPreviewTree = [];
    req.session.data.transferEgressDestinationId = null;
    req.session.data.transferEgressDestinationName = null;
    req.session.data.transferSharedDriveToEgressCopySuccess = false;
    req.session.data.transferSharedDriveToEgressList = [];
    req.session.data.transferSharedDriveToEgressPreviewTree = [];
    req.session.data.transferSharedDriveToEgressDestinationId = null;
    req.session.data.transferSharedDriveToEgressDestinationName = null;
    req.session.data.transferSharedDriveToEgressDestinationHref = null;
    };
}

router.get('/lcc/materials/03-case-overview', function (req, res) {
    const target = req.query.activeTab === 'tab-1-content'
        ? 'transfer-materials'
        : req.query.activeTab === 'tab-3-content'
            ? 'activity-log'
            : 'manage-materials';
    const query = new URLSearchParams(req.query);
    query.delete('activeTab');
    const queryString = query.toString();

    res.redirect(`/version-18/lcc/materials/${target}${queryString ? `?${queryString}` : ''}`);
});

router.get('/lcc/materials/transfer-materials', renderCaseOverviewPage('transfer-materials', 'tab-1-content'));
router.get('/lcc/materials/manage-materials', renderCaseOverviewPage('manage-materials', 'tab-2-content'));
router.get('/lcc/materials/activity-log', renderCaseOverviewPage('activity-log', 'tab-3-content'));

router.get('/lcc/materials/copy-conflict-result', function (req, res) {
    req.session.data.copyConflictLoading = false;
    req.session.data.copyConflictPending = true;
    res.redirect('/version-18/lcc/materials/manage-materials');
});

router.get('/lcc/materials/move-conflict-result', function (req, res) {
    req.session.data.moveConflictLoading = false;
    req.session.data.moveConflictPending = true;
    res.redirect('/version-18/lcc/materials/manage-materials');
});


router.get('/version-18/manage-materials', function (req, res) {
    const search = req.session.data['filtersSearch'];
    const materialsData = req.session.data.materials || res.locals.data.materials || [];
    let results = materialsData;

    if (search && search.trim() !== "") {
        const term = search.toLowerCase();

        results = materialsData.filter(m =>
            m.name.toLowerCase().includes(term) ||
            m.type.toLowerCase().includes(term) ||
            m.category.toLowerCase().includes(term)
        );
    }

    res.render('version-18/manage-materials', {
        results    // send filtered list to HTML
    });
});


router.post('/lcc/materials/case-overview-folder', function (req, res) {
    const materials = req.session.data.materials || res.locals.data.materials || [];
    let parentFolder = null;
    const validActiveTabs = ['tab-1-content', 'tab-2-content', 'tab-3-content'];
    const activeTab = validActiveTabs.includes(req.body.activeTab) ? req.body.activeTab : 'tab-2-content';
    const validTransferViews = ['egress', 'shared-drive'];
    const transferView = validTransferViews.includes(req.body.transferView) ? req.body.transferView : 'egress';
    const isTransferSharedDrive = activeTab === 'tab-1-content' && transferView === 'shared-drive';

    // req.session.data.currentLevel = req.body['currentLevel']
    // req.session.data.selectedFolder = req.body['selectedFolder']
    req.session.data.searchLabel = req.body['searchLabel']
    if (isTransferSharedDrive) {
        req.session.data.transferSharedDriveFolderId = req.body['folderId'] || 0
        req.session.data.transferSharedDriveFolderName = req.body['folderName'] || ''
    } else {
        req.session.data.folderId = req.body['folderId']
        req.session.data.folderName = req.body['folderName']
    }
    req.session.data.activeTab = activeTab;
    req.session.data.transferView = transferView;
    //    req.session.data.breadcrumbs.push(req.session.data.folderName)
    if (isTransferSharedDrive) {
        console.log("Selected transfer Shared Drive folder id:", req.session.data.transferSharedDriveFolderId)
        console.log("Selected transfer Shared Drive folder name:", req.session.data.transferSharedDriveFolderName)
    } else {
        console.log("Selected folder id:", req.session.data.folderId)
        console.log("Selected folder name:", req.session.data.folderName)
        req.session.data.level = req.body['level']
        console.log("Selected level:", req.session.data.level)
        if (req.session.data.folderName) {
            parentFolder = materials.find(m => m.name === req.session.data.folderName && m.folder);
        }
    }
    if (!isTransferSharedDrive) {
        const parentId = parentFolder ? parentFolder.id : 0;
        req.session.data.parentId = parentId

        console.log("Selected folder ID:", parentId)
    }
    req.session.data.filtersSearch = ""
    console.log("Cleared search term", req.session.data.filtersSearch)
    const targetPage = activeTab === 'tab-1-content'
        ? 'transfer-materials'
        : activeTab === 'tab-3-content'
            ? 'activity-log'
            : 'manage-materials';
    const transferViewQuery = activeTab === 'tab-1-content' ? `?transferView=${encodeURIComponent(transferView)}` : '';
    res.redirect(`/version-18/lcc/materials/${targetPage}${transferViewQuery}`)
})

router.post('/lcc/materials/transfer-egress-folder', function (req, res) {
    req.session.data.transferEgressFolderId = req.body.folderId || 100;
    req.session.data.transferEgressFolderName = req.body.folderName || '';
    req.session.data.activeTab = 'tab-1-content';
    req.session.data.transferView = 'egress';

    res.redirect('/version-18/lcc/materials/transfer-materials?transferView=egress');
});


router.post('/lcc/materials/case-overview-search-folder', function (req, res) {
    const materials = req.session.data.materials || res.locals.data.materials || [];

    // Incoming from form/button
    const folderId = req.body.folderId;
    const search = (req.body.searchLabel || "").trim().toLowerCase();
    const flag = req.body.flag;

    req.session.data.folderId = folderId;
    // req.session.data.filtersSearch = search;
    req.session.data.flag = flag;

    console.log("Selected folderId:", folderId);
    console.log("Search term:", req.session.data.filtersSearch);

    // --- Always match folder by ID, not name ---
    const parentFolder = materials.find(m =>
        m.id == folderId && m.folder
    );

    const parentId = parentFolder ? parentFolder.id : null;
    req.session.data.parentId = parentId;

    console.log("ParentId:", parentId);

    // Run your search inside this folder
    req.session.data.folderSearchResults = getFilesInFolderBySearch(
        materials,
        parentId,
        search
    );

    function getFilesInFolderBySearch(materials, parentId, search) {

        if (!search || !parentId) return [];

        const term = search.trim().toLowerCase();

        return materials.filter(item =>
            !item.folder &&
            item.parentId == parentId &&
            item.name.toLowerCase().includes(term)
        );
    }

    console.log("Search results:", req.session.data.folderSearchResults);

    res.redirect('/version-18/lcc/materials/03-case-overview');
});


router.post('/lcc/materials/shared-drive', function (req, res) {
    req.session.data.level = req.body['level']
    req.session.data.parentId = req.body['parentId']
    console.log("Selected level (Shared Drive):", req.session.data.level)
    console.log("Selected parent ID (Shared Drive):", req.session.data.parentId)
    res.redirect('/version-18/lcc/materials/03-case-overview')
})



router.post('/lcc/materials/clear-search', function (req, res) {
    req.session.data.filtersSearch = ""
    res.redirect('/version-18/lcc/materials/03-case-overview')
})


router.get('/lcc/materials/new-folder', function (req, res) {
    console.log("parentId in session:", req.session.data.currentFolder);
    res.render('version-18/lcc/materials/new-folder');
});

router.post('/lcc/materials/new-folder', function (req, res) {
    console.log("parentId in session post:", Number(req.session.data.currentFolder));
    console.log("folderId:", req.body.parentFolder);
    let data = req.session.data;
    let materials = data.materials || [];

    const currentFolder = req.session.data.currentFolder || 0;
    const parentFolder = req.session.data.parentFolder || 0;
    const parentId = Number(req.session.data.folderId || 0);

    const newFolderName = req.body.newFolderName?.trim();

    console.log("Creating new folder:", newFolderName);

    if (!newFolderName) {
        return res.render('version-18/lcc/materials/new-folder', {
            error: "Enter a folder name"
        });
    }

    // Get highest existing ID in materials
    const maxId = materials.length > 0
        ? Math.max(...materials.map(m => Number(m.id)))
        : 0;

    req.session.data.flashNewFolderId = maxId + 1;

    // Create new folder object
    const newFolder = {
        id: maxId + 1,
        name: newFolderName,
        type: null,
        category: null,
        date: null,
        status: null,
        new: false,
        docLink: null,
        previewLink: null,
        parentId: parentFolder ? Number(parentFolder) : currentFolder,
        folder: true,
        level: parentFolder != 0 ? 2 : 1,
    };

    console.log('Creating folder:', newFolder);

    materials.unshift(newFolder);

    // Save back into session
    data.materials = materials;

    pushMaterialsActivity(data, {
        type: 'new-folder',
        title: 'Folder created',
        sourceLines: [
            {
                label: 'New folder:',
                value: getItemPathLabel(materials, newFolder, null, data),
                href: `/version-18/lcc/materials/manage-materials?folderId=${newFolder.id}`
            }
        ]
    });

    // Redirect back to manage materials
    res.redirect('/version-18/lcc/materials/manage-materials');
});


router.post('/version-18/lcc/materials/case-overview', function (req, res) {
    const data = req.session.data;
    res.render('version-18/lcc/materials/manage-materials', { materials: data.materials || [], data });
});



router.post('/lcc/materials/delete', function (req, res) {
    const data = req.session.data;
    const materials = data.materials || [];
    const selected = req.body.material_selected
        ? [...new Set(req.body.material_selected.split(',').map(s => s.trim()).filter(Boolean))]
        : [];
    const validDeleteVariants = ['regular', 'tree', 'large', 'paginated'];
    const requestedDeleteVariant = req.body.delete_variant || req.query.variant;
    const deleteVariant = validDeleteVariants.includes(requestedDeleteVariant) ? requestedDeleteVariant : 'large';
    req.session.data.deleteVariant = deleteVariant;
    const preview = deleteVariant === 'large' || deleteVariant === 'paginated'
        ? { tree: buildLargeDeleteScenarioTree() }
        : buildDeleteSelectionPreview(materials, selected);
    const deleteView = {
        regular: 'delete',
        tree: 'delete2',
        large: 'delete3',
        paginated: 'delete4'
    }[deleteVariant];

    res.render(`version-18/lcc/materials/${deleteView}`, {
        data: {
            ...data,
            material_selected: req.body.material_selected || '',
            deleteVariant,
            deleteItemsPreviewTree: preview.tree,
            deleteItemsCount: countPreviewTreeItems(preview.tree)
        }
    });
});

// Discard material
router.post('/lcc/materials/discard-material', function (req, res) {
    const selected = req.body.material_selected
        ? [...new Set(req.body.material_selected.split(',').map(s => s.trim()).filter(Boolean))]
        : [];

    const deleteChoice = (req.body['delete-choice'] || '').trim();
    const validDeleteVariants = ['regular', 'tree', 'large', 'paginated'];
    const requestedDeleteVariant = req.body.delete_variant || req.query.variant || req.session.data.deleteVariant;
    const deleteVariant = validDeleteVariants.includes(requestedDeleteVariant) ? requestedDeleteVariant : 'large';
    req.session.data.deleteVariant = deleteVariant;
    const overviewUrl = `/version-18/lcc/materials/03-case-overview?deleteVariant=${deleteVariant}`;
    const reason = req.body.discarding_material;

    const materials = req.session.data.materials || [];

    // If nothing selected, just go back safely.
    if (!selected.length) {
        return res.redirect(overviewUrl);
    }

    // Build parent -> children map.
    const byParent = new Map();
    materials.forEach(m => {
        const p = m.parentId ?? null;
        if (!byParent.has(String(p))) byParent.set(String(p), []);
        byParent.get(String(p)).push(String(m.id));
    });

    if (!deleteChoice) {
        const preview = deleteVariant === 'large' || deleteVariant === 'paginated'
            ? { tree: buildLargeDeleteScenarioTree() }
            : buildDeleteSelectionPreview(materials, selected);
        const deleteView = {
            regular: 'delete',
            tree: 'delete2',
            large: 'delete3',
            paginated: 'delete4'
        }[deleteVariant];

        return res.render(`version-18/lcc/materials/${deleteView}`, {
            data: {
                ...req.session.data,
                ...req.body,
                material_selected: req.body.material_selected || '',
                deleteVariant,
                deleteItemsPreviewTree: preview.tree,
                deleteItemsCount: countPreviewTreeItems(preview.tree),
                deleteChoiceError: 'Select whether you want to delete these items'
            }
        });
    }

    if (deleteChoice === 'No') {
        return res.redirect(overviewUrl);
    }

    // If folders should remove descendants too, expand IDs.
    const toRemove = new Set(selected.map(String));

    // BFS/DFS down the tree
    const stack = [...toRemove];
    while (stack.length) {
        const id = stack.pop();
        const kids = byParent.get(String(id)) || [];
        kids.forEach(kid => {
            if (!toRemove.has(kid)) {
                toRemove.add(kid);
                stack.push(kid);
            }
        });
    }

    const removedItems = materials.filter(m => toRemove.has(String(m.id)));
    const deleteRootIds = [...new Set(removedItems
        .filter(item => !toRemove.has(String(item.parentId)))
        .map(item => String(item.id)))];
    const deletePreviewTree = buildPreviewTree(materials, deleteRootIds);

    req.session.data.materials = materials.filter(m => !toRemove.has(String(m.id)));
    req.session.data.deletePreviewTree = deletePreviewTree;
    req.session.data.deleteSuccess = removedItems.length > 0;

    if (removedItems.length) {
        const sourceParents = [...new Set(removedItems.map(item => getFolderPathLabel(materials, item.parentId, req.session.data)))];
        const sourceParentIds = [...new Set(removedItems.map(item => String(item.parentId ?? 0)))];

        pushMaterialsActivity(req.session.data, {
            type: 'delete',
            title: 'Items deleted',
            listItems: removedItems.map(item => item.name),
            previewTree: deletePreviewTree,
            sourceLines: [
                {
                    label: sourceParents.length === 1 ? 'Location:' : 'Locations:',
                    value: sourceParents.length === 1 ? sourceParents[0] : 'Multiple locations',
                    href: sourceParents.length === 1 ? `/version-18/lcc/materials/03-case-overview?folderId=${sourceParentIds[0]}` : null
                }
            ]
        });
    }

    req.session.data.lastDiscard = {
        reason,
        items: Array.from(toRemove),
        date: new Date().toISOString()
    };

    res.redirect(overviewUrl);
});


router.post('/lcc/materials/materials-action', function (req, res) {
    const { action, selectedId } = req.body;

    if (action !== 'rename') return res.redirect('back');

    const id = (selectedId || "").toString();
    const materials = req.session.data.materials || [];
    const item = materials.find(m => m && (m.id?.toString() === id));

    if (!item) return res.redirect('/version-18/lcc/materials/03-case-overview');

    return res.render('version-18/lcc/materials/rename', { item });
});

// router.post('/lcc/materials/materials-action', function (req, res) {
//     const { action, selectedId, selectedName, selectedIsFolder } = req.body;

//     if (action === 'rename') {
//         req.session.data.renameId = selectedId;
//         req.session.data.renameName = selectedName;
//         req.session.data.renameIsFolder = (selectedIsFolder === 'true');

//         return res.redirect('/version-18/lcc/materials/rename-from-list'); // <-- use your real rename page
//     }

//     // handle other actions...
//     return res.redirect('back');
// });



// router.post('/lcc/materials/rename-from-list', function (req, res) {

//   // Support BOTH old + new forms
//   const id =
//     (req.body.selectedId || "") ||
//     (req.body.material_selected || "") ||
//     (Array.isArray(req.body.materials_document) ? req.body.materials_document[0] : req.body.materials_document) ||
//     "";

//   const idStr = id.toString();

//   console.log('Rename-from-list resolved ID:', idStr);
//   console.log('Rename-from-list body keys:', Object.keys(req.body));

//   if (!idStr) {
//     console.log('❌ Rename-from-list: missing ID');
//     return res.redirect('/version-18/lcc/materials/03-case-overview');
//   }

//   const materials = req.session.data.materials || [];
//   const item = materials.find(m => m && (m.id?.toString() === idStr));

//   if (!item) {
//     console.log('❌ Rename-from-list: item not found', idStr);
//     return res.redirect('/version-18/lcc/materials/03-case-overview');
//   }

//   return res.render('version-18/lcc/materials/rename', { item });
// });

router.post('/lcc/materials/rename-from-list', function (req, res) {
    const sessionData = req.session.data || {};
    const materials = sessionData.materials || [];

    const raw = (req.body.selected_ids || '').toString().trim();
    const ids = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const selectedItems = materials.filter(m => ids.includes(String(m.id)));
    req.session.data.renameCount = selectedItems.length;

    if (!selectedItems.length) {
        return res.redirect('/lcc/materials/case-overview-folder');
    }

    return res.render('version-18/lcc/materials/rename-multiple', {
        selectedItems,
        selectedIds: ids
    });
});

router.post('/lcc/materials/rename-multiple-save', function (req, res) {
    const sessionData = req.session.data || {};
    const materials = sessionData.materials || [];

    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (key.startsWith('new_name_')) {
            const id = key.replace('new_name_', '');
            updates[id] = (req.body[key] || '').toString().trim();
        }
    });

    const renamedEntries = [];
    const blockedRenameEntries = [];

    materials.forEach(item => {
        const id = String(item.id);
        if (updates[id] !== undefined && updates[id] !== '') {
            if (
                item &&
                !item.folder &&
                item.name === 'File A' &&
                Number(item.parentId) === 1007
            ) {
                blockedRenameEntries.push(item);
                return;
            }

            renamedEntries.push({
                item,
                oldName: item.name,
                newName: updates[id]
            });
            item.name = updates[id];
        }
    });

    req.session.data.materials = materials;
    req.session.data.flashRenamedIds = renamedEntries.map(entry => String(entry.item.id));

    if (renamedEntries.length) {
        const locationPaths = [...new Set(renamedEntries.map(entry => getFolderPathLabel(materials, entry.item.parentId, req.session.data)))];
        const locationIds = [...new Set(renamedEntries.map(entry => String(entry.item.parentId ?? 0)))];
        const renameNameMap = Object.fromEntries(
            renamedEntries.map(entry => [
                String(entry.item.id),
                entry.item.folder
                    ? { name: entry.oldName, renamedTo: entry.newName }
                    : `${entry.oldName} → ${entry.newName}`
            ])
        );
        const renamePreviewTree = buildPreviewTree(
            materials,
            renamedEntries.map(entry => String(entry.item.id)),
            renameNameMap,
            false,
            false
        );

        pushMaterialsActivity(req.session.data, {
            type: 'rename',
            title: renamedEntries.length === 1 ? 'Item renamed' : 'Items renamed',
            listItems: renamedEntries.map(entry => `${entry.oldName} → ${entry.newName}`),
            previewTree: renamePreviewTree,
            sourceLines: [
                {
                    label: locationPaths.length === 1 ? 'Location:' : 'Locations:',
                    value: locationPaths.length === 1 ? locationPaths[0] : 'Multiple locations',
                    href: locationPaths.length === 1 ? `/version-18/lcc/materials/03-case-overview?folderId=${locationIds[0]}` : null
                }
            ]
        });
    }

    if (blockedRenameEntries.length) {
        req.session.data.renameBlockedLoadingName = blockedRenameEntries.map(item => item.name).join(', ');
        const blockedFolderId = blockedRenameEntries[0].parentId ?? 0;
        return res.redirect(`/version-18/lcc/materials/manage-materials?folderId=${encodeURIComponent(blockedFolderId)}`);
    }

    return res.redirect('/version-18/lcc/materials/03-case-overview');
});


// router.post('/lcc/materials/rename-from-list', function (req, res) {
//     const id = Number(req.body.material_selected);

//     console.log('Rename-from-list ID:', id);

//     if (!id) {
//         console.log('❌ Rename-from-list: invalid ID');
//         return res.redirect('/version-18/lcc/materials/03-case-overview');
//     }

//     const materials = req.session.data.materials || [];
//     const item = materials.find(m => m.id === id);

//     if (!item) {
//         console.log('❌ Rename-from-list: item not found', id);
//         return res.redirect('/version-18/lcc/materials/03-case-overview');
//     }

//     res.render('version-18/lcc/materials/rename', { item });
// });


router.post('/lcc/materials/rename', function (req, res) {
    console.log('Rename POST body:', req.body);

    const data = req.session.data;
    const materials = data.materials || [];

    const id = Number(req.body.id);
    const newName = req.body.newName?.trim();

    const item = materials.find(m => m.id === id);

    if (!item) {
        return res.redirect('/version-18/lcc/materials/03-case-overview');
    }

    if (!newName) {
        return res.render('version-18/lcc/materials/rename', {
            item,
            error: 'Enter a name'
        });
    }

    const oldName = item.name;
    item.name = newName;
    req.session.data.flashRenamedId = item.id;

    if (!item.folder) {
        item.date = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    data.materials = materials;

    pushMaterialsActivity(data, {
        type: 'rename',
        title: 'Item renamed',
        listItems: [`${oldName} → ${newName}`],
        previewTree: buildPreviewTree(materials, [String(item.id)], {
            [String(item.id)]: item.folder
                ? { name: oldName, renamedTo: newName }
                : `${oldName} → ${newName}`
        }, false, false),
        sourceLines: [
            {
                label: 'Location:',
                value: getFolderPathLabel(materials, item.parentId, req.session.data),
                href: `/version-18/lcc/materials/03-case-overview?folderId=${item.parentId ?? 0}`
            }
        ]
    });

    req.session.data.groupedSearchResults = null; // or [] to force rebuild on next render

    return res.redirect('/version-18/lcc/materials/03-case-overview');
});

// -----------------------------------------------------
// RENAME MATERIAL (page)
// -----------------------------------------------------

// router.get('/lcc/materials/rename', function (req, res) {
//     const data = req.session.data;
//     const materials = data.materials || [];
//     const id = Number(req.query.id);

//     const item = materials.find(m => m.id === id);

//     if (!item) {
//         return res.redirect('/version-18/lcc/materials/03-case-overview');
//     }

//     res.render('version-18/lcc/materials/rename', {
//         item
//     });
// });


// router.post('/lcc/materials/rename', function (req, res) {
//     const data = req.session.data;
//     let materials = data.materials || [];

//     const id = Number(req.body.id);
//     const newName = req.body.newName?.trim();

//     const item = materials.find(m => m.id === id);

//     if (!item) {
//         return res.redirect('/version-18/lcc/materials/03-case-overview');
//     }

//     if (!newName) {
//         return res.render('version-18/lcc/materials/rename', {
//             item,
//             error: "Enter a name"
//         });
//     }

//     // Apply rename
//     item.name = newName;
//     if (item.folder == false) {
//         item.date = new Date().toLocaleDateString('en-GB', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//     }

//     console.log(`✏️ Renamed material ID ${id} to "${newName}" and last update "${item.date}"`);

//     // Save back to session
//     data.materials = materials;

//     // 🔙 Redirect to correct place based on parent folder
//     const parent = item.parentId || 0;

//     if (parent !== 0) {
//         return res.redirect(`/version-18/lcc/materials/03-case-overview?folder=${parent}`);
//     }

//     return res.redirect('/version-18/lcc/materials/03-case-overview');
// });




router.post('/lcc/materials/set-materials-mode', function (req, res) {
    const mode = req.body.mode;
    const selectedIds = req.body.selected_ids || '';

    req.session.data.materialsMode = mode || null;
    req.session.data.materialsSelected = selectedIds;   // <-- THIS LINE IS THE KEY

    res.redirect('/version-18/lcc/materials/03-case-overview');
});

// Helper: recursively collect ALL descendants of a folder (flat list)
function getAllDescendants(materials, parentId) {
    const results = [];
    const stack = [parentId];

    while (stack.length > 0) {
        const currentId = stack.pop();

        const children = materials.filter(m => String(m.parentId) === String(currentId));

        children.forEach(child => {
            results.push(child);
            stack.push(child.id);
        });
    }

    return results;
}

// Helper: build a nested tree for preview in the banner
function buildPreviewTree(materials, rootIds, nameOverrides = {}, includeDescendants = true, boldFolders = true) {
    const byId = {};
    materials.forEach(m => {
        byId[String(m.id)] = m;
    });

    function buildNode(item) {
        const override = nameOverrides[String(item.id)];
        const children = includeDescendants
            ? materials
                .filter(m => String(m.parentId) === String(item.id))
                .map(buildNode)
                .sort((first, second) => Number(second.isFolder) - Number(first.isFolder))
            : [];

        const itemCount = children.reduce((total, child) => {
            return total + 1 + (child.isFolder ? child.itemCount : 0);
        }, 0);

        return {
            id: item.id,
            name: override && typeof override === 'object' ? override.name : (override || item.name),
            isFolder: !!item.folder,
            isBold: !!item.folder && boldFolders,
            itemCount: item.folder ? itemCount : 0,
            renamedTo: override && typeof override === 'object' ? override.renamedTo : null,
            children
        };
    }

    return rootIds
        .map(id => byId[String(id)])
        .filter(Boolean)
        .map(buildNode);
}

function buildDeleteSelectionPreview(materials, selectedIds) {
    const selectedSet = new Set(selectedIds.map(String));
    const byParent = new Map();

    materials.forEach(item => {
        const parentId = String(item.parentId ?? null);
        if (!byParent.has(parentId)) byParent.set(parentId, []);
        byParent.get(parentId).push(String(item.id));
    });

    const stack = [...selectedSet];
    while (stack.length) {
        const id = stack.pop();
        (byParent.get(String(id)) || []).forEach(childId => {
            if (!selectedSet.has(childId)) {
                selectedSet.add(childId);
                stack.push(childId);
            }
        });
    }

    const selectedItems = materials.filter(item => selectedSet.has(String(item.id)));
    const rootIds = selectedItems
        .filter(item => !selectedSet.has(String(item.parentId)))
        .map(item => String(item.id));

    return { tree: buildPreviewTree(materials, [...new Set(rootIds)]) };
}

// Large, made-up folder structure used by the delete3 high-volume prototype.
function buildLargeDeleteScenarioTree() {
    const sectionNames = [
        '1. Case management',
        '2. Conference and hearing notes',
        '3. Experts',
        '4. Counsel',
        '5. Correspondence',
        '6. Disclosure',
        '7. Finance',
        '8. Lawyer working copies',
        '9. Prosecution working copies',
        '10. Police material',
        '11. Media',
        '12. Victims and witnesses',
        '13. Digital case system',
        '14. Magistrates court',
        '15. Initial details of the prosecution case',
        '16. Forensics',
        '17. Exhibits',
        '18. Defence material',
        '19. Court orders',
        '20. Archive'
    ];
    const fileTypes = ['Statement', 'Exhibit', 'Report', 'Interview', 'Schedule'];

    function makeFolder(id, name, children) {
        const orderedChildren = [...children].sort((first, second) => {
            return Number(second.isFolder) - Number(first.isFolder);
        });
        const itemCount = orderedChildren.reduce((total, child) => {
            return total + 1 + (child.isFolder ? child.itemCount : 0);
        }, 0);

        return { id, name, isFolder: true, itemCount, children: orderedChildren };
    }

    function makeDeepFolderBranch(idPrefix, folderNames, files) {
        return folderNames.reduceRight((child, folderName, folderIndex) => {
            const children = Array.isArray(child) ? child : [child];
            return makeFolder(`${idPrefix}-deep-${folderIndex}`, folderName, children);
        }, files);
    }

    return sectionNames.map((sectionName, sectionIndex) => {
        // Include a few empty first-tier folders in the high-volume scenario.
        if ([5, 9, 12, 15, 18, 19].includes(sectionIndex)) {
            return makeFolder(`delete3-${sectionIndex}`, sectionName, []);
        }

        const batchCount = 5 + ((sectionIndex * 7) % 8);
        const batches = Array.from({ length: batchCount }, (_, batchIndex) => {
            const evidenceFolderCount = 3 + ((sectionIndex * 5 + batchIndex * 3) % 9);
            const evidenceFolders = Array.from({ length: evidenceFolderCount }, (_, folderIndex) => {
                const sequence = String((sectionIndex * 100) + (batchIndex * 10) + folderIndex + 1).padStart(4, '0');
                const folderId = `delete3-${sectionIndex}-${batchIndex}-${folderIndex}`;
                const fileType = fileTypes[(sectionIndex + batchIndex + folderIndex) % fileTypes.length];
                const fileCount = 1 + ((sectionIndex * 3 + batchIndex * 5 + folderIndex * 7) % 8);
                const files = Array.from({ length: fileCount }, (_, fileIndex) => {
                    const versions = ['original', 'working-copy', 'signed', 'reviewed', 'final', 'supplement'];

                    return {
                        id: `${folderId}-${fileIndex}`,
                        name: `${fileType}_${sequence}_${versions[fileIndex % versions.length]}_${fileIndex + 1}`,
                        isFolder: false,
                        itemCount: 0,
                        children: []
                    };
                });

                if (sectionIndex === 0 && batchIndex === 0 && folderIndex === 0) {
                    const deepBranch = makeDeepFolderBranch(folderId, [
                        'Initial review',
                        'Evidence assessment',
                        'Disclosure review',
                        'Senior review',
                        'Final approval'
                    ], files);

                    return makeFolder(folderId, `Material group ${sequence}`, [deepBranch]);
                }

                if (sectionIndex === 2 && batchIndex === 0 && folderIndex === 0) {
                    const deepBranch = makeDeepFolderBranch(folderId, [
                        'Expert evidence',
                        'Medical evidence',
                        'Consultant reports',
                        'Quality assurance',
                        'Approved reports'
                    ], files);

                    return makeFolder(folderId, `Material group ${sequence}`, [deepBranch]);
                }

                return makeFolder(folderId, `Material group ${sequence}`, files);
            });

            const batchChildren = [];
            evidenceFolders.forEach((evidenceFolder, evidenceFolderIndex) => {
                batchChildren.push(evidenceFolder);

                if (evidenceFolderIndex % 2 === 0) {
                    batchChildren.push({
                        id: `delete3-${sectionIndex}-${batchIndex}-loose-${evidenceFolderIndex}`,
                        name: `Batch_${String(batchIndex + 1).padStart(2, '0')}_index_${evidenceFolderIndex + 1}`,
                        isFolder: false,
                        itemCount: 0,
                        children: []
                    });
                }
            });

            return makeFolder(
                `delete3-${sectionIndex}-${batchIndex}`,
                `Batch ${String(batchIndex + 1).padStart(2, '0')}`,
                batchChildren
            );
        });

        const sectionChildren = [];
        batches.forEach((batch, batchIndex) => {
            sectionChildren.push(batch);

            if (batchIndex % 3 === 0) {
                sectionChildren.push({
                    id: `delete3-${sectionIndex}-section-file-${batchIndex}`,
                    name: `Section_${String(sectionIndex + 1).padStart(2, '0')}_case-note_${batchIndex + 1}`,
                    isFolder: false,
                    itemCount: 0,
                    children: []
                });
            }
        });

        return makeFolder(`delete3-${sectionIndex}`, sectionName, sectionChildren);
    });
}

function countPreviewTreeItems(nodes) {
    return nodes.reduce((total, node) => {
        return total + 1 + (node.isFolder ? node.itemCount : 0);
    }, 0);
}

function getTransferEgressDescendants(transferEgress, parentId) {
    const results = [];
    const stack = [parentId];

    while (stack.length > 0) {
        const currentId = stack.pop();
        const children = transferEgress.filter(item => String(item.parentId) === String(currentId));

        children.forEach(child => {
            results.push(child);
            stack.push(child.id);
        });
    }

    return results;
}

function buildTransferEgressPreviewTree(transferEgress, rootIds) {
    const byId = {};
    transferEgress.forEach(item => {
        byId[String(item.id)] = item;
    });

    function buildNode(item) {
        return {
            id: item.id,
            name: item.name,
            isFolder: !!item.folder,
            isBold: !!item.folder,
            children: getTransferEgressDescendants(transferEgress, item.id)
                .filter(child => String(child.parentId) === String(item.id))
                .map(buildNode)
        };
    }

    return rootIds
        .map(id => byId[String(id)])
        .filter(Boolean)
        .map(buildNode);
}

function getTransferEgressPathLabel(transferEgress, folderId, data = {}) {
    const parts = [];
    let currentId = folderId;
    const seen = new Set();
    const rootLabel = getEgressRootLabel(data);

    while (currentId && String(currentId) !== '100' && !seen.has(String(currentId))) {
        seen.add(String(currentId));
        const folder = transferEgress.find(item => item && item.folder && String(item.id) === String(currentId));
        if (!folder) break;
        parts.unshift(folder.name);
        currentId = folder.parentId;
    }

    return parts.length ? `${rootLabel} > ${parts.join(' > ')}` : rootLabel;
}

function getTransferEgressFolderHref(folderId) {
    return `/version-18/lcc/materials/transfer-materials?transferView=egress&transferEgressFolderId=${encodeURIComponent(folderId || 100)}`;
}

function transferEgressToSharedDrive(data, defaultsData, ids, destinationFolderId, shouldMove) {
    const materials = (data.materials && data.materials.length ? data.materials : defaultsData.materials || []);
    const transferEgress = (Array.isArray(data.transferEgress) ? data.transferEgress : defaultsData.transferEgress || []);
    const originalTransferEgress = transferEgress.map(item => ({ ...item }));
    const previewTree = buildTransferEgressPreviewTree(originalTransferEgress, ids);
    const transferredNames = [];
    const conflictingNames = [];
    const transferredEgressIds = new Set();
    let nextId = Date.now();

    const destinationFolder = materials.find(item => String(item.id) === String(destinationFolderId));
    const destinationFolderName = destinationFolder ? destinationFolder.name : null;

    function addMaterialFromEgress(item, parentId) {
        // Prototype scenario: most files in "Counsel only" fail so the
        // transfer completes partially while the remaining materials succeed.
        const isCounselOnlyTransferFailure =
            String(item.parentId) === '2' &&
            ['120', '121', '122', '123', '124', '125', '126'].includes(String(item.id));
        const hasNameConflict = materials.some(existing =>
            String(existing.parentId) === String(parentId) &&
            String(existing.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
        );

        if (isCounselOnlyTransferFailure || hasNameConflict) {
            conflictingNames.push(item.name);
            return;
        }

        const newId = nextId++;
        transferredNames.push(item.name);
        transferredEgressIds.add(String(item.id));

        materials.push({
            ...item,
            id: newId,
            parentId,
            date: item.date || item.description || '',
            category: item.category || '',
            type: item.type || '',
            order: '',
            new: true
        });

        originalTransferEgress
            .filter(child => String(child.parentId) === String(item.id))
            .forEach(child => addMaterialFromEgress(child, newId));
    }

    ids.forEach(id => {
        const item = originalTransferEgress.find(entry => String(entry.id) === String(id));
        if (!item) return;

        addMaterialFromEgress(item, destinationFolderId);
    });

    if (shouldMove) {
        // Keep any source folders that still contain an item which failed to move.
        originalTransferEgress
            .filter(item => !transferredEgressIds.has(String(item.id)))
            .forEach(item => {
                let parentId = item.parentId;
                while (parentId !== undefined && parentId !== null) {
                    transferredEgressIds.delete(String(parentId));
                    const parent = originalTransferEgress.find(entry => String(entry.id) === String(parentId));
                    if (!parent) break;
                    parentId = parent.parentId;
                }
            });
        data.transferEgress = transferEgress.filter(item => !transferredEgressIds.has(String(item.id)));
    } else {
        data.transferEgress = transferEgress;
    }

    data.materials = materials;
    data.transferEgressList = transferredNames;
    data.transferEgressPreviewTree = previewTree;
    data.transferEgressDestinationId = destinationFolderId;
    data.transferEgressDestinationName = destinationFolderName;
    data.transferEgressCopySuccess = !shouldMove && transferredNames.length > 0;
    data.transferEgressMoveSuccess = !!shouldMove && transferredNames.length > 0;
    data.transferEgressPartialSuccess = conflictingNames.length > 0 && transferredNames.length > 0;
    data.transferEgressConflictItems = conflictingNames;
    if (conflictingNames.length > 0) {
        data.transferEgressRetryItems = conflictingNames;
    }
    if (data.transferEgressRetryAttempt && conflictingNames.length > 0) {
        data.transferEgressRetryFailedAlert = true;
    }
    data.transferEgressRetryAttempt = false;
    data.activeTab = 'tab-1-content';
    data.transferView = 'egress';

    if (transferredNames.length) {
        const transferAction = shouldMove ? 'moved' : 'copied';
        const selectedItems = ids
            .map(id => originalTransferEgress.find(item => String(item.id) === String(id)))
            .filter(Boolean);
        const sourceParents = [...new Set(selectedItems.map(item => getTransferEgressPathLabel(originalTransferEgress, item.parentId, data)))];
        const sourceParentIds = [...new Set(selectedItems.map(item => String(item.parentId ?? 100)))];

        pushMaterialsActivity(data, {
            type: shouldMove ? 'move' : 'copy',
            tag: 'Transfer',
            statusTag: conflictingNames.length ? 'Partially completed' : 'Completed',
            statusTagColour: conflictingNames.length ? 'orange' : 'green',
            title: 'Transfer from Egress to Shared Drive',
            description: `${transferredNames.length} ${transferredNames.length === 1 ? 'item was' : 'items were'} ${transferAction}`,
            listItems: transferredNames,
            conflictListItems: conflictingNames,
            previewTree,
            sourceLines: [
                {
                    label: sourceParents.length === 1 ? 'Original location:' : 'Original locations:',
                    value: sourceParents.length === 1 ? sourceParents[0] : 'Multiple locations',
                    href: sourceParents.length === 1 ? getTransferEgressFolderHref(sourceParentIds[0]) : null
                },
                {
                    label: 'New location:',
                    value: getFolderPathLabel(materials, destinationFolderId, data),
                    href: `/version-18/lcc/materials/transfer-materials?transferView=shared-drive&transferSharedDriveFolderId=${destinationFolderId}`
                }
            ]
        });
    }

    return {
        transferredNames,
        conflictingNames,
        destinationFolderName,
        previewTree
    };
}

function buildEgressFolderTree(transferEgress) {
    const folders = transferEgress.filter(item => item && item.folder);
    const byParent = new Map();

    folders.forEach(folder => {
        const parentKey = String(folder.parentId);
        if (!byParent.has(parentKey)) byParent.set(parentKey, []);
        byParent.get(parentKey).push(folder);
    });

    for (const folderList of byParent.values()) {
        folderList.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    function buildNode(folder) {
        const children = byParent.get(String(folder.id)) || [];
        return {
            ...folder,
            children: children.map(buildNode)
        };
    }

    return (byParent.get('100') || []).map(buildNode);
}

function getNextEgressId(transferEgress) {
    const numericIds = transferEgress.map(item => Number(item.id)).filter(Number.isFinite);
    return Math.max(1000, ...numericIds) + 1;
}

function transferSharedDriveToEgress(data, defaultsData, ids, destinationFolderId) {
    const materials = (data.materials && data.materials.length ? data.materials : defaultsData.materials || []);
    const transferEgress = (Array.isArray(data.transferEgress) ? data.transferEgress : defaultsData.transferEgress || []);
    const originalMaterials = materials.map(item => ({ ...item }));
    const previewTree = buildPreviewTree(originalMaterials, ids);
    const copiedNames = [];
    let nextId = getNextEgressId(transferEgress);

    function addEgressFromMaterial(item, parentId, level) {
        const newId = nextId++;
        copiedNames.push(item.name);

        transferEgress.push({
            id: newId,
            name: item.name,
            order: '',
            description: item.date || item.description || '',
            category: item.category || '',
            date: item.date || item.description || '',
            status: item.status || 'None',
            new: false,
            docLink: item.docLink || '',
            previewLink: item.previewLink || '',
            parentId,
            folder: !!item.folder,
            level
        });

        originalMaterials
            .filter(child => String(child.parentId) === String(item.id))
            .forEach(child => addEgressFromMaterial(child, newId, level + 1));
    }

    const destinationFolder = transferEgress.find(item => item && item.folder && String(item.id) === String(destinationFolderId));
    const destinationLevel = destinationFolder ? Number(destinationFolder.level || 1) : 0;

    ids.forEach(id => {
        const item = originalMaterials.find(entry => String(entry.id) === String(id));
        if (!item) return;

        addEgressFromMaterial(item, destinationFolderId, destinationLevel + 1);
    });

    data.transferEgress = transferEgress;
    data.transferSharedDriveToEgressList = copiedNames;
    data.transferSharedDriveToEgressPreviewTree = previewTree;
    data.transferSharedDriveToEgressDestinationId = destinationFolderId;
    data.transferSharedDriveToEgressDestinationName = getTransferEgressPathLabel(transferEgress, destinationFolderId, data);
    data.transferSharedDriveToEgressDestinationHref = getTransferEgressFolderHref(destinationFolderId);
    data.transferSharedDriveToEgressCopySuccess = true;
    data.activeTab = 'tab-1-content';
    data.transferView = 'shared-drive';

    if (copiedNames.length) {
        const selectedItems = ids
            .map(id => originalMaterials.find(item => String(item.id) === String(id)))
            .filter(Boolean);
        const sourceParents = [...new Set(selectedItems.map(item => getFolderPathLabel(originalMaterials, item.parentId, data)))];
        const sourceParentIds = [...new Set(selectedItems.map(item => String(item.parentId ?? 0)))];

        pushMaterialsActivity(data, {
            type: 'copy',
            tag: 'Transfer',
            statusTag: 'Completed',
            title: 'Transfer from Shared Drive to Egress',
            description: `${copiedNames.length} ${copiedNames.length === 1 ? 'item was' : 'items were'} copied`,
            listItems: copiedNames,
            previewTree,
            sourceLines: [
                {
                    label: sourceParents.length === 1 ? 'Original location:' : 'Original locations:',
                    value: sourceParents.length === 1 ? sourceParents[0] : 'Multiple locations',
                    href: sourceParents.length === 1 ? `/version-18/lcc/materials/transfer-materials?transferView=shared-drive&transferSharedDriveFolderId=${sourceParentIds[0]}` : null
                },
                {
                    label: 'New location:',
                    value: getTransferEgressPathLabel(transferEgress, destinationFolderId, data),
                    href: getTransferEgressFolderHref(destinationFolderId)
                }
            ]
        });
    }
}

router.post('/lcc/materials/copy-material-old', function (req, res) {

    const data = req.session.data;
    req.session.data.moveSuccess = false;   // Clear move flag

    const ids = req.body.selected_ids
        ? req.body.selected_ids.split(',').map(x => String(x).trim())
        : [];

    const destinationFolderId = req.body.destinationFolder;
    const materials = req.session.data.materials || [];

    console.log("Copying:", ids, "into folder", destinationFolderId);

    // Take a snapshot BEFORE we mutate materials, for preview tree
    const originalMaterials = materials.map(item => ({ ...item }));

    // For banner
    const copiedNames = [];

    // Destination folder name for the banner
    let destinationFolderName = null;
    const destFolder = materials.find(m => String(m.id) === String(destinationFolderId));
    if (destFolder) {
        destinationFolderName = destFolder.name;
    }

    // Build tree preview from the original structure (before copying)
    const copyPreviewTree = buildPreviewTree(originalMaterials, ids);

    // Actually perform the copy (with full structure)
    ids.forEach(id => {
        const original = materials.find(m => String(m.id) === id);
        if (!original) return;

        // Record for banner
        copiedNames.push(original.name);

        // Map old→new IDs so structure stays intact
        const idMap = {};
        const newId = Date.now() + Math.random();
        idMap[id] = newId;

        // Clone the folder/file itself
        const topClone = {
            ...original,
            id: newId,
            parentId: destinationFolderId
        };
        materials.push(topClone);

        // Get all nested descendants
        const descendants = getAllDescendants(originalMaterials, id);

        descendants.forEach(child => {
            const newChildId = Date.now() + Math.random();
            idMap[child.id] = newChildId;

            materials.push({
                ...child,
                id: newChildId,
                parentId: idMap[child.parentId]   // reconnect the tree
            });

            copiedNames.push(child.name); // Add to banner list
        });
    });

    // Store results for banner
    req.session.data.copyList = copiedNames;
    req.session.data.copyDestinationName = destinationFolderName;
    req.session.data.copyPreviewTree = copyPreviewTree;
    req.session.data.copySuccess = true;

    if (copiedNames.length) {
        const sourceItems = ids
            .map(id => originalMaterials.find(m => String(m.id) === String(id)))
            .filter(Boolean);
        const sourceParents = [...new Set(sourceItems.map(item => getFolderPathLabel(originalMaterials, item.parentId, data)))];
        const sourceParentIds = [...new Set(sourceItems.map(item => String(item.parentId ?? 0)))];

        pushMaterialsActivity(req.session.data, {
            type: 'copy',
            title: 'Items copied',
            listItems: copiedNames,
            previewTree: copyPreviewTree,
            sourceLines: [
                {
                    label: sourceParents.length === 1 ? 'Original location:' : 'Original locations:',
                    value: sourceParents.length === 1 ? sourceParents[0] : 'Multiple locations',
                    href: sourceParents.length === 1 ? `/version-18/lcc/materials/03-case-overview?folderId=${sourceParentIds[0]}` : null
                },
                {
                    label: 'New location:',
                    value: getFolderPathLabel(materials, destinationFolderId, data),
                    href: `/version-18/lcc/materials/03-case-overview?folderId=${destinationFolderId}`
                }
            ]
        });
    }

    // Reset selection + mode
    req.session.data.materialsMode = null;
    req.session.data.materialsSelected = '';

    res.redirect('/version-18/lcc/materials/03-case-overview');
});


router.post('/lcc/materials/start-copy', function (req, res) {
    // selected_ids could be "1,2,3" or an array depending on your form
    const ids = req.body.selected_ids
        ? String(req.body.selected_ids).split(',').map(x => String(x).trim()).filter(Boolean)
        : [];

    // Store selection for the next page
    req.session.data.copySelectedIds = ids;
    req.session.data.copySelectedCount = ids.length;
    req.session.data.copySource = null;

    // Optional: store names for a hint banner on folder-tree-copy
    const materials = (req.session.data.materials || res.locals.data.materials || []);
    req.session.data.copySelectedNames = ids
        .map(id => (materials.find(m => String(m.id) === String(id)) || {}).name)
        .filter(Boolean);

    // Send them to the folder picker page
    res.redirect('/version-18/lcc/materials/folder-tree-copy');
});

router.post('/lcc/materials/dismiss-transfer-retry-alert', function (req, res) {
    req.session.data.transferEgressRetryFailedAlert = false;
    req.session.data.transferEgressRetryItems = [];
    res.redirect('/version-18/lcc/materials/transfer-materials?transferView=egress');
});

router.post('/lcc/materials/start-transfer-egress-copy', function (req, res) {
    const ids = req.body.selected_ids
        ? String(req.body.selected_ids).split(',').map(x => String(x).trim()).filter(Boolean)
        : [];

    const transferEgress = (Array.isArray(req.session.data.transferEgress)
        ? req.session.data.transferEgress
        : res.locals.data.transferEgress || []);

    req.session.data.copySource = 'egress';
    req.session.data.copySelectedIds = ids;
    req.session.data.copySelectedCount = ids.length;
    req.session.data.copySelectedNames = ids
        .map(id => (transferEgress.find(item => String(item.id) === String(id)) || {}).name)
        .filter(Boolean);

    res.redirect('/version-18/lcc/materials/folder-tree-copy');
});

router.post('/lcc/materials/start-transfer-shared-drive-copy', function (req, res) {
    const ids = req.body.selected_ids
        ? String(req.body.selected_ids).split(',').map(x => String(x).trim()).filter(Boolean)
        : [];

    const materials = (req.session.data.materials || res.locals.data.materials || []);

    req.session.data.transferSharedDriveCopySelectedIds = ids;
    req.session.data.transferSharedDriveCopySelectedCount = ids.length;
    req.session.data.transferSharedDriveCopySelectedNames = ids
        .map(id => (materials.find(item => String(item.id) === String(id)) || {}).name)
        .filter(Boolean);

    res.redirect('/version-18/lcc/materials/folder-tree-egress-copy');
});


// start-move 3 February 2026
router.post('/lcc/materials/start-move', function (req, res) {
    // selected_ids could be "1,2,3" or an array depending on your form
    const ids = req.body.selected_ids
        ? String(req.body.selected_ids).split(',').map(x => String(x).trim()).filter(Boolean)
        : [];

    // Store selection for the next page
    req.session.data.moveSelectedIds = ids;
    req.session.data.moveSelectedCount = ids.length;
    req.session.data.moveSource = null;

    // Optional: store names for a hint banner on folder-tree-copy
    const materials = (req.session.data.materials || res.locals.data.materials || []);
    req.session.data.moveSelectedNames = ids
        .map(id => (materials.find(m => String(m.id) === String(id)) || {}).name)
        .filter(Boolean);

    // Send them to the folder picker page
    res.redirect('/version-18/lcc/materials/folder-tree-move');
});

router.post('/lcc/materials/start-transfer-egress-move', function (req, res) {
    const ids = req.body.selected_ids
        ? String(req.body.selected_ids).split(',').map(x => String(x).trim()).filter(Boolean)
        : [];

    const transferEgress = (Array.isArray(req.session.data.transferEgress)
        ? req.session.data.transferEgress
        : res.locals.data.transferEgress || []);

    req.session.data.moveSource = 'egress';
    req.session.data.moveSelectedIds = ids;
    req.session.data.moveSelectedCount = ids.length;
    req.session.data.moveSelectedNames = ids
        .map(id => (transferEgress.find(item => String(item.id) === String(id)) || {}).name)
        .filter(Boolean);

    res.redirect('/version-18/lcc/materials/folder-tree-move');
});


router.post('/lcc/materials/copy-material', function (req, res) {

    const data = req.session.data;
    req.session.data.moveSuccess = false;

    // Pull selection from session (set by /start-copy)
    const ids = Array.isArray(req.session.data.copySelectedIds)
        ? req.session.data.copySelectedIds.map(String)
        : [];

    const destinationFolderId = req.body.destinationFolder;
    req.session.data.copyDestinationId = destinationFolderId;

    if (req.session.data.copySource === 'egress') {
        if (!ids.length || !destinationFolderId) {
            req.session.data.copyError = "Select at least one item and a destination folder";
            return res.redirect('/version-18/lcc/materials/folder-tree-copy');
        }

        transferEgressToSharedDrive(req.session.data, res.locals.data || {}, ids, destinationFolderId, false);

        req.session.data.copySource = null;
        req.session.data.copySelectedIds = [];
        req.session.data.copySelectedNames = [];
        req.session.data.copySelectedCount = 0;

        return res.redirect('/version-18/lcc/materials/transfer-materials?transferView=egress');
    }

    const materials = (req.session.data.materials || res.locals.data.materials || []);

    console.log("Copying:", ids, "into folder", destinationFolderId);

    if (!ids.length || !destinationFolderId) {
        // In a prototype, just bounce back with a flag
        req.session.data.copyError = "Select at least one item and a destination folder";
        return res.redirect('/version-18/lcc/materials/folder-tree-copy');
    }

    // Snapshot BEFORE mutation
    const originalMaterials = materials.map(item => ({ ...item }));

    const copiedNames = [];

    let destinationFolderName = null;
    const destFolder = materials.find(m => String(m.id) === String(destinationFolderId));
    if (destFolder) destinationFolderName = destFolder.name;

    const destinationChildren = materials.filter(
        item => String(item.parentId ?? '') === String(destinationFolderId)
    );
    const destinationChildNames = new Set(
        destinationChildren.map(item => String(item.name || '').trim().toLowerCase())
    );
    const conflictingItems = ids
        .map(id => materials.find(item => String(item.id) === String(id)))
        .filter(Boolean)
        .filter(item => destinationChildNames.has(String(item.name || '').trim().toLowerCase()));
    const conflictingIdSet = new Set(conflictingItems.map(item => String(item.id)));
    const idsToCopy = ids.filter(id => !conflictingIdSet.has(String(id)));

    const copyPreviewTree = buildPreviewTree(originalMaterials, idsToCopy);

    idsToCopy.forEach(id => {
        const original = materials.find(m => String(m.id) === id);
        if (!original) return;

        copiedNames.push(original.name);

        const idMap = {};
        const newId = Date.now() + Math.random();
        idMap[id] = newId;

        materials.push({
            ...original,
            id: newId,
            parentId: destinationFolderId
        });

        const descendants = getAllDescendants(originalMaterials, id);

        descendants.forEach(child => {
            const newChildId = Date.now() + Math.random();
            idMap[child.id] = newChildId;

            materials.push({
                ...child,
                id: newChildId,
                parentId: idMap[child.parentId]
            });

            copiedNames.push(child.name);
        });
    });

    // Persist mutated materials back into session so it sticks
    req.session.data.materials = materials;

    req.session.data.copyList = copiedNames;
    req.session.data.copyDestinationName = destinationFolderName;
    req.session.data.copyPreviewTree = copyPreviewTree;
    req.session.data.copySuccess = copiedNames.length > 0;

    if (copiedNames.length) {
        const sourceItems = idsToCopy
            .map(id => originalMaterials.find(m => String(m.id) === String(id)))
            .filter(Boolean);
        const sourceParents = [...new Set(sourceItems.map(item => getFolderPathLabel(originalMaterials, item.parentId, data)))];
        const sourceParentIds = [...new Set(sourceItems.map(item => String(item.parentId ?? 0)))];

        pushMaterialsActivity(req.session.data, {
            type: 'copy',
            title: conflictingItems.length ? 'Some items were copied successfully' : 'Items copied',
            ...(conflictingItems.length ? {
                statusTag: 'Partially completed',
                statusTagColour: 'orange',
                conflictListItems: conflictingItems.map(item => item.name)
            } : {}),
            listItems: copiedNames,
            previewTree: copyPreviewTree,
            sourceLines: [
                {
                    label: sourceParents.length === 1 ? 'Original location:' : 'Original locations:',
                    value: sourceParents.length === 1 ? sourceParents[0] : 'Multiple locations',
                    href: sourceParents.length === 1 ? `/version-18/lcc/materials/03-case-overview?folderId=${sourceParentIds[0]}` : null
                },
                {
                    label: 'New location:',
                    value: getFolderPathLabel(materials, destinationFolderId, data),
                    href: `/version-18/lcc/materials/03-case-overview?folderId=${destinationFolderId}`
                }
            ]
        });
    }

    if (conflictingItems.length) {
        const conflictSourceParents = [...new Set(conflictingItems.map(item => getFolderPathLabel(originalMaterials, item.parentId, data)))];
        const conflictSourceParentIds = [...new Set(conflictingItems.map(item => String(item.parentId ?? 0)))];

        if (!copiedNames.length) {
            pushMaterialsActivity(req.session.data, {
                type: 'copy',
                title: 'Items not copied',
                description: 'Files with the same name already exist in the destination.',
                listItems: conflictingItems.map(item => item.name),
                sourceLines: [
                    {
                        label: 'From:',
                        value: conflictSourceParents.length === 1 ? conflictSourceParents[0] : 'Multiple locations',
                        href: conflictSourceParents.length === 1 ? `/version-18/lcc/materials/manage-materials?folderId=${conflictSourceParentIds[0]}` : null
                    },
                    {
                        label: 'To:',
                        value: getFolderPathLabel(materials, destinationFolderId, data),
                        href: `/version-18/lcc/materials/manage-materials?folderId=${destinationFolderId}`
                    }
                ]
            });
        }

        req.session.data.copyConflictLoading = true;
        req.session.data.copyConflictMessage =
            conflictingItems.length === 1
                ? copiedNames.length > 0
                    ? '1 item with the same name already exists in this location.'
                    : '1 item with the same name already exists in this location. No items were copied.'
                : copiedNames.length > 0
                    ? `${conflictingItems.length} items with the same name already exist in this location.`
                    : `${conflictingItems.length} items with the same name already exist in this location. No items were copied.`;
        req.session.data.copyConflictItems = conflictingItems.map(item => item.name);
        req.session.data.copyDestinationName = destinationFolderName;
    }

    // Clear selection state
    req.session.data.copySelectedIds = [];
    req.session.data.copySelectedNames = [];
    req.session.data.copySelectedCount = 0;

    // Reset selection + mode
    req.session.data.materialsMode = null;
    req.session.data.materialsSelected = '';

    res.redirect('/version-18/lcc/materials/03-case-overview');
});


// move-material 3 February 2026
router.post('/lcc/materials/move-material', function (req, res) {

    const data = req.session.data;
    req.session.data.moveSuccess = false;

    // Pull selection from session (set by /start-copy)
    const ids = Array.isArray(req.session.data.moveSelectedIds)
        ? req.session.data.moveSelectedIds.map(String)
        : [];

    const destinationFolderId = req.body.destinationFolder;
    req.session.data.moveDestinationId = destinationFolderId;

    if (req.session.data.moveSource === 'egress') {
        if (!ids.length || !destinationFolderId) {
            req.session.data.moveError = "Select at least one item and a destination folder";
            return res.redirect('/version-18/lcc/materials/folder-tree-move');
        }

        transferEgressToSharedDrive(req.session.data, res.locals.data || {}, ids, destinationFolderId, true);

        req.session.data.moveSource = null;
        req.session.data.moveSelectedIds = [];
        req.session.data.moveSelectedNames = [];
        req.session.data.moveSelectedCount = 0;

        return res.redirect('/version-18/lcc/materials/transfer-materials?transferView=egress');
    }

    const materials = (req.session.data.materials || res.locals.data.materials || []);

    console.log("Moving:", ids, "into folder", destinationFolderId);

    if (!ids.length || !destinationFolderId) {
        // In a prototype, just bounce back with a flag
        req.session.data.moveError = "Select at least one item and a destination folder";
        return res.redirect('/version-18/lcc/materials/folder-tree-move');
    }

    // Snapshot BEFORE mutation
    const originalMaterials = materials.map(item => ({ ...item }));

    const movedNames = [];

    const destFolder = materials.find(m => String(m.id) === String(destinationFolderId));
    const destinationFolderName = destFolder ? destFolder.name : null;

    const destinationChildren = materials.filter(
        item => String(item.parentId ?? '') === String(destinationFolderId)
    );
    const destinationChildNames = new Set(
        destinationChildren.map(item => String(item.name || '').trim().toLowerCase())
    );
    const conflictingItems = ids
        .map(id => materials.find(item => String(item.id) === String(id)))
        .filter(Boolean)
        .filter(item => destinationChildNames.has(String(item.name || '').trim().toLowerCase()));
    const conflictingIdSet = new Set(conflictingItems.map(item => String(item.id)));
    const idsToMove = ids.filter(id => !conflictingIdSet.has(String(id)));

    const movePreviewTree = buildPreviewTree(originalMaterials, idsToMove);

    idsToMove.forEach(id => {
        const original = materials.find(m => String(m.id) === String(id));
        if (!original) return;

        // Don’t allow moving an item into itself
        if (String(original.id) === String(destinationFolderId)) return;

        // Don’t allow moving a folder into one of its descendants
        if (original.folder) {
            const descendantIds = getAllDescendants(originalMaterials, original.id).map(d => String(d.id));
            if (descendantIds.includes(String(destinationFolderId))) return;
        }

        movedNames.push(original.name);

        // ✅ MOVE (no cloning)
        original.parentId = destinationFolderId;
    });

    // Persist mutated materials back into session so it sticks
    req.session.data.materials = materials;

    req.session.data.moveList = movedNames;
    req.session.data.moveDestinationName = destinationFolderName;
    req.session.data.movePreviewTree = movePreviewTree;
    req.session.data.moveSuccess = movedNames.length > 0;

    if (movedNames.length) {
        const sourceItems = idsToMove
            .map(id => originalMaterials.find(m => String(m.id) === String(id)))
            .filter(Boolean);
        const sourceParents = [...new Set(sourceItems.map(item => getFolderPathLabel(originalMaterials, item.parentId, data)))];
        const sourceParentIds = [...new Set(sourceItems.map(item => String(item.parentId ?? 0)))];

        pushMaterialsActivity(req.session.data, {
            type: 'move',
            title: conflictingItems.length ? 'Some items were moved successfully' : 'Items moved',
            ...(conflictingItems.length ? {
                statusTag: 'Partially completed',
                statusTagColour: 'orange',
                conflictListItems: conflictingItems.map(item => item.name)
            } : {}),
            listItems: movedNames,
            previewTree: movePreviewTree,
            sourceLines: [
                {
                    label: sourceParents.length === 1 ? 'Original location:' : 'Original locations:',
                    value: sourceParents.length === 1 ? sourceParents[0] : 'Multiple locations',
                    href: sourceParents.length === 1 ? `/version-18/lcc/materials/03-case-overview?folderId=${sourceParentIds[0]}` : null
                },
                {
                    label: 'New location:',
                    value: getFolderPathLabel(materials, destinationFolderId, data),
                    href: `/version-18/lcc/materials/03-case-overview?folderId=${destinationFolderId}`
                }
            ]
        });
    }

    if (conflictingItems.length) {
        const conflictSourceParents = [...new Set(conflictingItems.map(item => getFolderPathLabel(originalMaterials, item.parentId, data)))];
        const conflictSourceParentIds = [...new Set(conflictingItems.map(item => String(item.parentId ?? 0)))];

        if (!movedNames.length) {
            pushMaterialsActivity(req.session.data, {
                type: 'move',
                title: 'Items not moved',
                description: 'Files with the same name already exist in the destination.',
                listItems: conflictingItems.map(item => item.name),
                sourceLines: [
                    {
                        label: 'From:',
                        value: conflictSourceParents.length === 1 ? conflictSourceParents[0] : 'Multiple locations',
                        href: conflictSourceParents.length === 1 ? `/version-18/lcc/materials/manage-materials?folderId=${conflictSourceParentIds[0]}` : null
                    },
                    {
                        label: 'To:',
                        value: getFolderPathLabel(materials, destinationFolderId, data),
                        href: `/version-18/lcc/materials/manage-materials?folderId=${destinationFolderId}`
                    }
                ]
            });
        }

        req.session.data.moveConflictLoading = true;
        req.session.data.moveConflictMessage =
            conflictingItems.length === 1
                ? movedNames.length > 0
                    ? '1 item with the same name already exists in this location.'
                    : '1 item with the same name already exists in this location. No items were moved.'
                : movedNames.length > 0
                    ? `${conflictingItems.length} items with the same name already exist in this location.`
                    : `${conflictingItems.length} items with the same name already exist in this location. No items were moved.`;
        req.session.data.moveConflictItems = conflictingItems.map(item => item.name);
        req.session.data.moveDestinationName = destinationFolderName;
    }

    // Clear selection state
    req.session.data.moveSelectedIds = [];
    req.session.data.moveSelectedNames = [];
    req.session.data.moveSelectedCount = 0;

    // Reset selection + mode
    req.session.data.materialsMode = null;
    req.session.data.materialsSelected = '';

    res.redirect('/version-18/lcc/materials/03-case-overview');
});

router.post('/lcc/materials/copy-transfer-shared-drive-to-egress', function (req, res) {
    const ids = Array.isArray(req.session.data.transferSharedDriveCopySelectedIds)
        ? req.session.data.transferSharedDriveCopySelectedIds.map(String)
        : [];
    const destinationFolderId = req.body.destinationFolder;

    if (!ids.length || !destinationFolderId) {
        req.session.data.copyError = "Select at least one item and a destination folder";
        return res.redirect('/version-18/lcc/materials/folder-tree-egress-copy');
    }

    transferSharedDriveToEgress(req.session.data, res.locals.data || {}, ids, destinationFolderId);

    req.session.data.transferSharedDriveCopySelectedIds = [];
    req.session.data.transferSharedDriveCopySelectedNames = [];
    req.session.data.transferSharedDriveCopySelectedCount = 0;

    return res.redirect('/version-18/lcc/materials/transfer-materials?transferView=shared-drive');
});


// Move – 3 February 2026
// router.post('/lcc/materials/move-material', function (req, res) {

//     req.session.data.copySuccess = false;

//     // Pull selection from session (set by /start-copy)
//     const ids = Array.isArray(req.session.data.moveSelectedIds)
//         ? req.session.data.moveSelectedIds.map(String)
//         : [];

//     const destinationFolderId = req.body.destinationFolder;
//     const materials = (req.session.data.materials || res.locals.data.materials || []);

//     console.log("Moving:", ids, "into folder", destinationFolderId);

//     if (!ids.length || !destinationFolderId) {
//         // In a prototype, just bounce back with a flag
//         req.session.data.moveError = "Select at least one item and a destination folder";
//         return res.redirect('/version-18/lcc/materials/folder-tree-move');
//     }

//     // Snapshot BEFORE mutation
//     const originalMaterials = [...materials];

//     const movedNames = [];

//     let destinationFolderName = null;
//     const destFolder = materials.find(m => String(m.id) === String(destinationFolderId));
//     if (destFolder) destinationFolderName = destFolder.name;

//     const movePreviewTree = buildPreviewTree(originalMaterials, ids);

//     ids.forEach(id => {
//         const original = materials.find(m => String(m.id) === id);
//         if (!original) return;

//         movedNames.push(original.name);

//         const idMap = {};
//         const newId = Date.now() + Math.random();
//         idMap[id] = newId;

//         materials.push({
//             ...original,
//             id: newId,
//             parentId: destinationFolderId
//         });

//         const descendants = getAllDescendants(originalMaterials, id);

//         descendants.forEach(child => {
//             const newChildId = Date.now() + Math.random();
//             idMap[child.id] = newChildId;

//             materials.push({
//                 ...child,
//                 id: newChildId,
//                 parentId: idMap[child.parentId]
//             });

//             movedNames.push(child.name);
//         });
//     });

//     // Persist mutated materials back into session so it sticks
//     req.session.data.materials = materials;

//     req.session.data.moveList = movedNames;
//     req.session.data.moveDestinationName = destinationFolderName;
//     req.session.data.movePreviewTree = movePreviewTree;
//     req.session.data.moveSuccess = true;

//     // Clear selection state
//     req.session.data.moveSelectedIds = [];
//     req.session.data.moveSelectedNames = [];
//     req.session.data.moveSelectedCount = 0;

//     // Reset selection + mode
//     req.session.data.materialsMode = null;
//     req.session.data.materialsSelected = '';

//     res.redirect('/version-18/lcc/materials/03-case-overview');
// });



// router.post('/lcc/materials/move-material-old', function (req, res) {

//     req.session.data.copySuccess = false;  // Clear copy flag

//     const ids = req.body.selected_ids
//         ? req.body.selected_ids.split(',').map(x => String(x).trim())
//         : [];

//     const destinationFolderId = req.body.destinationFolder;
//     const materials = req.session.data.materials || [];

//     console.log("Moving:", ids, "into folder", destinationFolderId);

//     // Snapshot BEFORE we move items (for preview)
//     const originalMaterials = [...materials];

//     // List for flat banner summary
//     const movedNames = [];

//     ids.forEach(id => {
//         const original = originalMaterials.find(m => String(m.id) === String(id));
//         if (original) movedNames.push(original.name);
//     });

//     // Destination folder name for banner
//     let destinationFolderName = null;
//     const destFolder = originalMaterials.find(m => String(m.id) === String(destinationFolderId));
//     if (destFolder) {
//         destinationFolderName = destFolder.name;
//     }

//     // Build nested preview tree (based on original structure)
//     const movePreviewTree = buildPreviewTree(originalMaterials, ids);

//     // Perform the move
//     req.session.data.materials = materials.map(m => {
//         if (ids.includes(String(m.id))) {
//             return { ...m, parentId: destinationFolderId };
//         }
//         return m;
//     });

//     // Banner data
//     req.session.data.moveList = movedNames;
//     req.session.data.moveDestinationName = destinationFolderName;
//     req.session.data.movePreviewTree = movePreviewTree;
//     req.session.data.moveSuccess = true;

//     // Reset selection + mode
//     req.session.data.materialsMode = null;
//     req.session.data.materialsSelected = '';

//     res.redirect('/version-18/lcc/materials/03-case-overview');
// });


// CLEAR ALL FILTERS


router.get('/includes/materials/clear-filters', function (req, res) {

    // Wipe all filter fields you use
    req.session.data.filterStatusUsed = null;
    req.session.data.filterStatusUnused = null;
    req.session.data.filterStatusNone = null;

    req.session.data.filtersSearch = null;

    // Redirect back to the materials page
    res.redirect('/version-18/lcc/materials/03-case-overview');
    // change this to whatever your main materials URL is
});

// CLEAR A SPECIFIC FILTER
router.get('/includes/materials/clear-filter', function (req, res) {

    const type = req.query.type;

    // Safely delete it from session
    if (type && req.session.data.hasOwnProperty(type)) {
        req.session.data[type] = null;
    }

    res.redirect('/version-18/lcc/materials/03-case-overview');
    // again: use your actual materials page URL
});


// New code for version-18
router.get('/lcc/materials/folder-tree-copy', function (req, res) {

    const sessionData = req.session.data || {};
    const defaultsData = res.locals.data || {};

    console.log("DEFAULT materials:", res.locals.data.materials?.length);
    console.log("SESSION materials:", req.session.data?.materials?.length);

    // Prefer session, fallback to defaults
    const materials =
        sessionData.materials && sessionData.materials.length
            ? sessionData.materials
            : defaultsData.materials || [];

    console.log("Materials length:", materials.length);

    // folders only
    const folders = materials.filter(m => m && m.folder);

    // group by parentId (NORMALISE TO STRING)
    const byParent = new Map();
    folders.forEach(f => {
        const parentKey = (f.parentId === null || f.parentId === undefined || f.parentId === '')
            ? null
            : String(f.parentId);

        if (!byParent.has(parentKey)) byParent.set(parentKey, []);
        byParent.get(parentKey).push(f);
    });

    for (const [key, arr] of byParent.entries()) {
        arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    // folder ids set (NORMALISE TO STRING)
    const folderIds = new Set(folders.map(f => String(f.id)));

    function isRoot(folder) {
        const parent = folder.parentId;

        // no parent
        if (parent === null || parent === undefined || parent === '') return true;

        // parent exists?
        return !folderIds.has(String(parent));
    }

    const roots = folders.filter(isRoot);

    function buildNode(node) {
        const children = byParent.get(String(node.id)) || [];
        return {
            ...node,
            children: children.map(buildNode)
        };
    }

    const folderTree = roots.map(buildNode);

    res.render('version-18/lcc/materials/folder-tree-copy', {
        folderTree
    });
});

router.get('/lcc/materials/folder-tree-egress-copy', function (req, res) {
    const sessionData = req.session.data || {};
    const defaultsData = res.locals.data || {};
    const transferEgress = (Array.isArray(sessionData.transferEgress)
        ? sessionData.transferEgress
        : defaultsData.transferEgress || []);

    res.render('version-18/lcc/materials/folder-tree-egress-copy', {
        folderTree: buildEgressFolderTree(transferEgress)
    });
});

// Move – 3 February 2026
router.get('/lcc/materials/folder-tree-move', function (req, res) {

    const sessionData = req.session.data || {};
    const defaultsData = res.locals.data || {};

    console.log("DEFAULT materials:", res.locals.data.materials?.length);
    console.log("SESSION materials:", req.session.data?.materials?.length);

    // Prefer session, fallback to defaults
    const materials =
        sessionData.materials && sessionData.materials.length
            ? sessionData.materials
            : defaultsData.materials || [];

    console.log("Materials length:", materials.length);

    // folders only
    const folders = materials.filter(m => m && m.folder);

    // group by parentId (NORMALISE TO STRING)
    const byParent = new Map();
    folders.forEach(f => {
        const parentKey = (f.parentId === null || f.parentId === undefined || f.parentId === '')
            ? null
            : String(f.parentId);

        if (!byParent.has(parentKey)) byParent.set(parentKey, []);
        byParent.get(parentKey).push(f);
    });

    for (const [key, arr] of byParent.entries()) {
        arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    // folder ids set (NORMALISE TO STRING)
    const folderIds = new Set(folders.map(f => String(f.id)));

    function isRoot(folder) {
        const parent = folder.parentId;

        // no parent
        if (parent === null || parent === undefined || parent === '') return true;

        // parent exists?
        return !folderIds.has(String(parent));
    }

    const roots = folders.filter(isRoot);

    function buildNode(node) {
        const children = byParent.get(String(node.id)) || [];
        return {
            ...node,
            children: children.map(buildNode)
        };
    }

    const folderTree = roots.map(buildNode);

    res.render('version-18/lcc/materials/folder-tree-move', {
        folderTree
    });
});



//New search at the top of the page
router.post('/lcc/materials/materials-search', function (req, res) {
    const term = (req.body.filtersSearch || '').trim();

    // Store in session so 03-case-overview can render search results
    req.session.data.filtersSearch = term;

    // Optional: when searching, reset folder context if you want
    // req.session.data.folderId = 0;

    return res.redirect('/version-18/lcc/materials/03-case-overview');
});



// 20 February 2026 – version 13

const materialsHelperFactory = require('../../helpers/materials.js');

router.get('/lcc/materials/order-materials', (req, res) => {
    const sessionData = req.session.data || {};
    const defaultsData = res.locals.data || {};

    const materials =
        (sessionData.materials && sessionData.materials.length
            ? sessionData.materials
            : defaultsData.materials) || [];

    // folderId from querystring, else session, else 0
    const folderId = Number(req.query.folderId ?? sessionData.folderId ?? 0);

    // persist context for templates that use data.folderId
    req.session.data.folderId = folderId;

    // ✅ PROTOTYPE SEED: only folder 1007 starts "ordered"
    sessionData.orderMeta = sessionData.orderMeta || {};
    sessionData._seededOrder1007 = sessionData._seededOrder1007 || false;

    if (!sessionData._seededOrder1007) {
        // 1) Seed "last ordered" message for folder 1007
        sessionData.orderMeta["1007"] = {
            person: "Roxanne Rowe",
            date: "12 January 2026"
        };

        // 2) Seed numeric order values for direct children of folder 1007 only
        const kids1007 = materials.filter(m => m && Number(m.parentId) === 1007);

        // Use current array order as the initial order (simple + stable for a prototype)
        kids1007.forEach((item, idx) => {
            item.order = idx + 1;
        });

        sessionData._seededOrder1007 = true;
    }

    const helper = materialsHelperFactory(materials);

    const breadcrumbs = helper.getBreadcrumbs(folderId);
    const children = helper.getChildren(folderId);
    const selectedOrderIds = String(req.query.selected_ids || '')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

    res.render('version-18/lcc/materials/order-materials', {
        folderId,
        breadcrumbs,
        children,
        selectedOrderIds
    });
});


router.post('/lcc/materials/order-materials', (req, res) => {

    console.log('✅ POST /order-materials hit', {
        sessionFolderId: req.session.data.folderId,
        bodyFolderId: req.body.folderId
    });

    // folderId might be '1000' OR ['1000','0'] if duplicate fields exist
    // ✅ Use the folder context you already stored when the page loaded
    const folderId = Number(req.session.data.folderId ?? 0);

    const sessionData = req.session.data || {};
    const defaultsData = res.locals.data || {};

    // Ensure we have a session copy to mutate (don’t mutate defaults)
    if (!sessionData.materials || !sessionData.materials.length) {
        sessionData.materials = (defaultsData.materials || []).map(m => ({ ...m }));
        req.session.data.materials = sessionData.materials;
    }

    const materials = sessionData.materials;
    // const folderId = Number(req.body.folderId ?? sessionData.folderId ?? 0);


    // 26 February 2026
    // 🔴 PROTOTYPE INTERRUPT RULE
    const shouldInterrupt = folderId === 1007; // hard-code whatever folder you want

    if (shouldInterrupt) {
        req.session.data.pendingOrderSave = {
            folderId,
            body: req.body
        };

        return res.redirect('/version-18/lcc/materials/order-interrupt');
    }
    // End of 26 February 2026


    // Only reorder items that are DIRECT children of this folder
    const children = materials.filter(m => Number(m.parentId) === folderId);

    // Read desired order from posted inputs: order_<id>
    const desiredById = new Map();
    children.forEach(item => {
        const key = `order_${item.id}`;
        const raw = req.body[key];
        const n = parseInt(raw, 10);

        // If blank/invalid, push it to the end
        desiredById.set(String(item.id), Number.isFinite(n) ? n : 999999);
    });

    // Sort children by desired order, then by name as a tie-break
    children.sort((a, b) => {
        const ao = desiredById.get(String(a.id)) ?? 999999;
        const bo = desiredById.get(String(b.id)) ?? 999999;
        if (ao !== bo) return ao - bo;
        return String(a.name || '').localeCompare(String(b.name || ''), 'en', { numeric: true, sensitivity: 'base' });
    });

    // Renumber to a clean 1..n and store onto the items
    children.forEach((item, idx) => {
        item.order = idx + 1;
    });

    // ✅ ADD THIS: Persist per-folder "last ordered" metadata
    req.session.data.orderMeta = req.session.data.orderMeta || {};
    req.session.data.orderMeta[String(folderId)] = {
        person: "You",
        date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    };

    // Persist current folder context too (helps other pages)
    req.session.data.folderId = folderId;


    return res.redirect(`/version-18/lcc/materials/manage-materials?folderId=${encodeURIComponent(folderId)}`);
});


router.post('/lcc/register-case/cancel-interrupt', (req, res) => {
    const returnTo = getSafeReturnTo(req.body?.returnTo);

    if (req.body['cancel-registration'] == 'Yes, cancel registration') {
        return res.redirect('/version-18/lcc/register-case/00-homepage');
    }
    else if (req.body['cancel-registration'] == 'No, go back and continue registration' && returnTo) {
        return res.redirect(returnTo);
    }

    return res.redirect('/version-18/lcc/register-case/00-homepage');
});


router.post('/lcc/materials/order-interrupt', (req, res) => {
    const pending = req.session.data.pendingOrderSave;
    if (!pending) {
        return res.redirect('/version-18/lcc/materials/03-case-overview');
    }

    const folderId = Number(pending.folderId ?? 0);
    req.session.data.folderId = folderId;

    const sessionData = req.session.data || {};
    const defaultsData = res.locals.data || {};

    if (!sessionData.materials || !sessionData.materials.length) {
        sessionData.materials = (defaultsData.materials || []).map(m => ({ ...m }));
        req.session.data.materials = sessionData.materials;
    }

    const materials = sessionData.materials;

    // Apply the exact same save logic, but using pending.body
    const children = materials.filter(m => Number(m.parentId) === folderId);

    const desiredById = new Map();
    children.forEach(item => {
        const key = `order_${item.id}`;
        const raw = pending.body[key];
        const n = parseInt(raw, 10);
        desiredById.set(String(item.id), Number.isFinite(n) ? n : 999999);
    });

    children.sort((a, b) => {
        const ao = desiredById.get(String(a.id)) ?? 999999;
        const bo = desiredById.get(String(b.id)) ?? 999999;
        if (ao !== bo) return ao - bo;
        return String(a.name || '').localeCompare(String(b.name || ''), 'en', { numeric: true, sensitivity: 'base' });
    });

    children.forEach((item, idx) => {
        item.order = idx + 1;
    });

    // ✅ ADD THIS: Persist per-folder "last ordered" metadata
    req.session.data.orderMeta = req.session.data.orderMeta || {};
    req.session.data.orderMeta[String(folderId)] = {
        person: "You",
        date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    };

    console.log('Person name and date:', req.session.data.orderPerson, req.session.data.orderDate);

    req.session.data.orderPerson = "You";
    req.session.data.orderDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    console.log('Person name and date:', req.session.data.orderPerson, req.session.data.orderDate);

    // Clean up the delayed save payload
    delete req.session.data.pendingOrderSave;

    return res.redirect(`/version-18/lcc/materials/manage-materials?folderId=${encodeURIComponent(folderId)}`);
});

router.post('/lcc/materials/disconnect-shared-drive', (req, res) => {
    const choice = req.body['disconnect-shared-drive-choice'];
    const data = req.session.data;
    req.session.data['disconnect-shared-drive-choice'] = choice;

    if (!choice) {
        return res.render('version-18/lcc/materials/disconnect-shared-drive', {
            disconnectSharedDriveError: 'Select whether you want to disconnect the Shared Drive'
        });
    }

    req.session.data.sharedDriveDisconnected = choice === 'Yes' ? 'Yes' : 'No';

    if (choice === 'Yes') {
        pushMaterialsActivity(data, {
            title: 'Shared Drive folder Thunderstruck disconnected from this case'
        });
        return res.redirect('disconnect-shared-drive-confirmation');
    }

    return res.redirect('transfer-materials');
});

router.post('/lcc/materials/disconnect-egress', (req, res) => {
    const choice = req.body['disconnect-egress-choice'];
    const data = req.session.data;
    req.session.data['disconnect-egress-choice'] = choice;

    if (!choice) {
        return res.render('version-18/lcc/materials/disconnect-egress', {
            disconnectEgressError: 'Select whether you want to disconnect Egress'
        });
    }

    req.session.data.egressDisconnected = choice === 'Yes' ? 'Yes' : 'No';

    if (choice === 'Yes') {
        pushMaterialsActivity(data, {
            title: 'Egress disconnected from this case'
        });
        return res.redirect('/version-18/lcc/materials/disconnect-egress-confirmation');
    }

    return res.redirect('transfer-materials');
});

module.exports = router
