(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["mssqlPlugin"],{

/***/ "./public/app/plugins/datasource/mssql/config_ctrl.ts":
/*!************************************************************!*\
  !*** ./public/app/plugins/datasource/mssql/config_ctrl.ts ***!
  \************************************************************/
/*! exports provided: MssqlConfigCtrl */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MssqlConfigCtrl", function() { return MssqlConfigCtrl; });
/* harmony import */ var _features_datasources_utils_passwordHandlers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../features/datasources/utils/passwordHandlers */ "./public/app/features/datasources/utils/passwordHandlers.ts");

var MssqlConfigCtrl = /** @class */ (function () {
    /** @ngInject */
    function MssqlConfigCtrl($scope) {
        this.current.jsonData.encrypt = this.current.jsonData.encrypt || 'false';
        this.onPasswordReset = Object(_features_datasources_utils_passwordHandlers__WEBPACK_IMPORTED_MODULE_0__["createResetHandler"])(this, _features_datasources_utils_passwordHandlers__WEBPACK_IMPORTED_MODULE_0__["PasswordFieldEnum"].Password);
        this.onPasswordChange = Object(_features_datasources_utils_passwordHandlers__WEBPACK_IMPORTED_MODULE_0__["createChangeHandler"])(this, _features_datasources_utils_passwordHandlers__WEBPACK_IMPORTED_MODULE_0__["PasswordFieldEnum"].Password);
    }
    MssqlConfigCtrl.templateUrl = 'partials/config.html';
    return MssqlConfigCtrl;
}());



/***/ }),

/***/ "./public/app/plugins/datasource/mssql/datasource.ts":
/*!***********************************************************!*\
  !*** ./public/app/plugins/datasource/mssql/datasource.ts ***!
  \***********************************************************/
/*! exports provided: MssqlDatasource */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MssqlDatasource", function() { return MssqlDatasource; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _response_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./response_parser */ "./public/app/plugins/datasource/mssql/response_parser.ts");


var MssqlDatasource = /** @class */ (function () {
    /** @ngInject */
    function MssqlDatasource(instanceSettings, backendSrv, $q, templateSrv, timeSrv) {
        this.backendSrv = backendSrv;
        this.$q = $q;
        this.templateSrv = templateSrv;
        this.timeSrv = timeSrv;
        this.name = instanceSettings.name;
        this.id = instanceSettings.id;
        this.responseParser = new _response_parser__WEBPACK_IMPORTED_MODULE_1__["default"](this.$q);
        this.interval = (instanceSettings.jsonData || {}).timeInterval || '1m';
    }
    MssqlDatasource.prototype.interpolateVariable = function (value, variable) {
        if (typeof value === 'string') {
            if (variable.multi || variable.includeAll) {
                return "'" + value.replace(/'/g, "''") + "'";
            }
            else {
                return value;
            }
        }
        if (typeof value === 'number') {
            return value;
        }
        var quotedValues = lodash__WEBPACK_IMPORTED_MODULE_0___default.a.map(value, function (val) {
            if (typeof value === 'number') {
                return value;
            }
            return "'" + val.replace(/'/g, "''") + "'";
        });
        return quotedValues.join(',');
    };
    MssqlDatasource.prototype.query = function (options) {
        var _this = this;
        var queries = lodash__WEBPACK_IMPORTED_MODULE_0___default.a.filter(options.targets, function (item) {
            return item.hide !== true;
        }).map(function (item) {
            return {
                refId: item.refId,
                intervalMs: options.intervalMs,
                maxDataPoints: options.maxDataPoints,
                datasourceId: _this.id,
                rawSql: _this.templateSrv.replace(item.rawSql, options.scopedVars, _this.interpolateVariable),
                format: item.format,
            };
        });
        if (queries.length === 0) {
            return this.$q.when({ data: [] });
        }
        return this.backendSrv
            .datasourceRequest({
            url: '/api/tsdb/query',
            method: 'POST',
            data: {
                from: options.range.from.valueOf().toString(),
                to: options.range.to.valueOf().toString(),
                queries: queries,
            },
        })
            .then(this.responseParser.processQueryResult);
    };
    MssqlDatasource.prototype.annotationQuery = function (options) {
        var _this = this;
        if (!options.annotation.rawQuery) {
            return this.$q.reject({ message: 'Query missing in annotation definition' });
        }
        var query = {
            refId: options.annotation.name,
            datasourceId: this.id,
            rawSql: this.templateSrv.replace(options.annotation.rawQuery, options.scopedVars, this.interpolateVariable),
            format: 'table',
        };
        return this.backendSrv
            .datasourceRequest({
            url: '/api/tsdb/query',
            method: 'POST',
            data: {
                from: options.range.from.valueOf().toString(),
                to: options.range.to.valueOf().toString(),
                queries: [query],
            },
        })
            .then(function (data) { return _this.responseParser.transformAnnotationResponse(options, data); });
    };
    MssqlDatasource.prototype.metricFindQuery = function (query, optionalOptions) {
        var _this = this;
        var refId = 'tempvar';
        if (optionalOptions && optionalOptions.variable && optionalOptions.variable.name) {
            refId = optionalOptions.variable.name;
        }
        var interpolatedQuery = {
            refId: refId,
            datasourceId: this.id,
            rawSql: this.templateSrv.replace(query, {}, this.interpolateVariable),
            format: 'table',
        };
        var range = this.timeSrv.timeRange();
        var data = {
            queries: [interpolatedQuery],
            from: range.from.valueOf().toString(),
            to: range.to.valueOf().toString(),
        };
        return this.backendSrv
            .datasourceRequest({
            url: '/api/tsdb/query',
            method: 'POST',
            data: data,
        })
            .then(function (data) { return _this.responseParser.parseMetricFindQueryResult(refId, data); });
    };
    MssqlDatasource.prototype.testDatasource = function () {
        return this.backendSrv
            .datasourceRequest({
            url: '/api/tsdb/query',
            method: 'POST',
            data: {
                from: '5m',
                to: 'now',
                queries: [
                    {
                        refId: 'A',
                        intervalMs: 1,
                        maxDataPoints: 1,
                        datasourceId: this.id,
                        rawSql: 'SELECT 1',
                        format: 'table',
                    },
                ],
            },
        })
            .then(function (res) {
            return { status: 'success', message: 'Database Connection OK' };
        })
            .catch(function (err) {
            console.log(err);
            if (err.data && err.data.message) {
                return { status: 'error', message: err.data.message };
            }
            else {
                return { status: 'error', message: err.status };
            }
        });
    };
    MssqlDatasource.prototype.targetContainsTemplate = function (target) {
        var rawSql = target.rawSql.replace('$__', '');
        return this.templateSrv.variableExists(rawSql);
    };
    return MssqlDatasource;
}());



/***/ }),

/***/ "./public/app/plugins/datasource/mssql/module.ts":
/*!*******************************************************!*\
  !*** ./public/app/plugins/datasource/mssql/module.ts ***!
  \*******************************************************/
/*! exports provided: MssqlDatasource, Datasource, QueryCtrl, ConfigCtrl, AnnotationsQueryCtrl */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnnotationsQueryCtrl", function() { return MssqlAnnotationsQueryCtrl; });
/* harmony import */ var _datasource__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./datasource */ "./public/app/plugins/datasource/mssql/datasource.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MssqlDatasource", function() { return _datasource__WEBPACK_IMPORTED_MODULE_0__["MssqlDatasource"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Datasource", function() { return _datasource__WEBPACK_IMPORTED_MODULE_0__["MssqlDatasource"]; });

/* harmony import */ var _query_ctrl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./query_ctrl */ "./public/app/plugins/datasource/mssql/query_ctrl.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "QueryCtrl", function() { return _query_ctrl__WEBPACK_IMPORTED_MODULE_1__["MssqlQueryCtrl"]; });

/* harmony import */ var _config_ctrl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config_ctrl */ "./public/app/plugins/datasource/mssql/config_ctrl.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ConfigCtrl", function() { return _config_ctrl__WEBPACK_IMPORTED_MODULE_2__["MssqlConfigCtrl"]; });




var defaultQuery = "SELECT\n    <time_column> as time,\n    <text_column> as text,\n    <tags_column> as tags\n  FROM\n    <table name>\n  WHERE\n    $__timeFilter(time_column)\n  ORDER BY\n    <time_column> ASC";
var MssqlAnnotationsQueryCtrl = /** @class */ (function () {
    /** @ngInject */
    function MssqlAnnotationsQueryCtrl() {
        this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
    }
    MssqlAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
    return MssqlAnnotationsQueryCtrl;
}());



/***/ }),

/***/ "./public/app/plugins/datasource/mssql/query_ctrl.ts":
/*!***********************************************************!*\
  !*** ./public/app/plugins/datasource/mssql/query_ctrl.ts ***!
  \***********************************************************/
/*! exports provided: MssqlQueryCtrl */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MssqlQueryCtrl", function() { return MssqlQueryCtrl; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var app_plugins_sdk__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! app/plugins/sdk */ "./public/app/plugins/sdk.ts");



var defaultQuery = "SELECT\n  $__timeEpoch(<time_column>),\n  <value column> as value,\n  <series name column> as metric\nFROM\n  <table name>\nWHERE\n  $__timeFilter(time_column)\nORDER BY\n  <time_column> ASC";
var MssqlQueryCtrl = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](MssqlQueryCtrl, _super);
    /** @ngInject */
    function MssqlQueryCtrl($scope, $injector) {
        var _this = _super.call(this, $scope, $injector) || this;
        _this.target.format = _this.target.format || 'time_series';
        _this.target.alias = '';
        _this.formats = [{ text: 'Time series', value: 'time_series' }, { text: 'Table', value: 'table' }];
        if (!_this.target.rawSql) {
            // special handling when in table panel
            if (_this.panelCtrl.panel.type === 'table') {
                _this.target.format = 'table';
                _this.target.rawSql = 'SELECT 1';
            }
            else {
                _this.target.rawSql = defaultQuery;
            }
        }
        _this.panelCtrl.events.on('data-received', _this.onDataReceived.bind(_this), $scope);
        _this.panelCtrl.events.on('data-error', _this.onDataError.bind(_this), $scope);
        return _this;
    }
    MssqlQueryCtrl.prototype.onDataReceived = function (dataList) {
        this.lastQueryMeta = null;
        this.lastQueryError = null;
        var anySeriesFromQuery = lodash__WEBPACK_IMPORTED_MODULE_1___default.a.find(dataList, { refId: this.target.refId });
        if (anySeriesFromQuery) {
            this.lastQueryMeta = anySeriesFromQuery.meta;
        }
    };
    MssqlQueryCtrl.prototype.onDataError = function (err) {
        if (err.data && err.data.results) {
            var queryRes = err.data.results[this.target.refId];
            if (queryRes) {
                this.lastQueryMeta = queryRes.meta;
                this.lastQueryError = queryRes.error;
            }
        }
    };
    MssqlQueryCtrl.templateUrl = 'partials/query.editor.html';
    return MssqlQueryCtrl;
}(app_plugins_sdk__WEBPACK_IMPORTED_MODULE_2__["QueryCtrl"]));



/***/ }),

/***/ "./public/app/plugins/datasource/mssql/response_parser.ts":
/*!****************************************************************!*\
  !*** ./public/app/plugins/datasource/mssql/response_parser.ts ***!
  \****************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);


var ResponseParser = /** @class */ (function () {
    function ResponseParser($q) {
        this.$q = $q;
    }
    ResponseParser.prototype.processQueryResult = function (res) {
        var e_1, _a, e_2, _b;
        var data = [];
        if (!res.data.results) {
            return { data: data };
        }
        for (var key in res.data.results) {
            var queryRes = res.data.results[key];
            if (queryRes.series) {
                try {
                    for (var _c = (e_1 = void 0, tslib__WEBPACK_IMPORTED_MODULE_0__["__values"](queryRes.series)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var series = _d.value;
                        data.push({
                            target: series.name,
                            datapoints: series.points,
                            refId: queryRes.refId,
                            meta: queryRes.meta,
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            if (queryRes.tables) {
                try {
                    for (var _e = (e_2 = void 0, tslib__WEBPACK_IMPORTED_MODULE_0__["__values"](queryRes.tables)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var table = _f.value;
                        table.type = 'table';
                        table.refId = queryRes.refId;
                        table.meta = queryRes.meta;
                        data.push(table);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        return { data: data };
    };
    ResponseParser.prototype.parseMetricFindQueryResult = function (refId, results) {
        if (!results || results.data.length === 0 || results.data.results[refId].meta.rowCount === 0) {
            return [];
        }
        var columns = results.data.results[refId].tables[0].columns;
        var rows = results.data.results[refId].tables[0].rows;
        var textColIndex = this.findColIndex(columns, '__text');
        var valueColIndex = this.findColIndex(columns, '__value');
        if (columns.length === 2 && textColIndex !== -1 && valueColIndex !== -1) {
            return this.transformToKeyValueList(rows, textColIndex, valueColIndex);
        }
        return this.transformToSimpleList(rows);
    };
    ResponseParser.prototype.transformToKeyValueList = function (rows, textColIndex, valueColIndex) {
        var res = [];
        for (var i = 0; i < rows.length; i++) {
            if (!this.containsKey(res, rows[i][textColIndex])) {
                res.push({ text: rows[i][textColIndex], value: rows[i][valueColIndex] });
            }
        }
        return res;
    };
    ResponseParser.prototype.transformToSimpleList = function (rows) {
        var res = [];
        for (var i = 0; i < rows.length; i++) {
            for (var j = 0; j < rows[i].length; j++) {
                var value = rows[i][j];
                if (res.indexOf(value) === -1) {
                    res.push(value);
                }
            }
        }
        return lodash__WEBPACK_IMPORTED_MODULE_1___default.a.map(res, function (value) {
            return { text: value };
        });
    };
    ResponseParser.prototype.findColIndex = function (columns, colName) {
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].text === colName) {
                return i;
            }
        }
        return -1;
    };
    ResponseParser.prototype.containsKey = function (res, key) {
        for (var i = 0; i < res.length; i++) {
            if (res[i].text === key) {
                return true;
            }
        }
        return false;
    };
    ResponseParser.prototype.transformAnnotationResponse = function (options, data) {
        var table = data.data.results[options.annotation.name].tables[0];
        var timeColumnIndex = -1;
        var textColumnIndex = -1;
        var tagsColumnIndex = -1;
        for (var i = 0; i < table.columns.length; i++) {
            if (table.columns[i].text === 'time') {
                timeColumnIndex = i;
            }
            else if (table.columns[i].text === 'text') {
                textColumnIndex = i;
            }
            else if (table.columns[i].text === 'tags') {
                tagsColumnIndex = i;
            }
        }
        if (timeColumnIndex === -1) {
            return this.$q.reject({ message: 'Missing mandatory time column (with time column alias) in annotation query.' });
        }
        var list = [];
        for (var i = 0; i < table.rows.length; i++) {
            var row = table.rows[i];
            list.push({
                annotation: options.annotation,
                time: Math.floor(row[timeColumnIndex]),
                text: row[textColumnIndex],
                tags: row[tagsColumnIndex] ? row[tagsColumnIndex].trim().split(/\s*,\s*/) : [],
            });
        }
        return list;
    };
    return ResponseParser;
}());
/* harmony default export */ __webpack_exports__["default"] = (ResponseParser);


/***/ })

}]);
//# sourceMappingURL=mssqlPlugin.fb2366366adbbbf1d38b.js.map