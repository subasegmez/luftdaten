var luftviz = luftviz || {};

/*
luftviz.page = (function ($) {
    // Private
    var populateSensors = function (el, config) {
        // Create drop down list of sensors
        // console.log(config);
        // $(el).append($('<option>', {value: null, text: 'Please select...'}));
        //
        // $.each(config.luftdaten_sensors, function (i, sensor) {
        //     console.log(sensor)
        //     var name = sensor.name + ' (' + sensor.code + ')',
        //         code = sensor.code;
        //     $(el).append($('<option>', {value: code, text: name}));
        // })
    };

    // Public
    return {
        populateSensors: populateSensors
    };
} (jQuery));
*/

luftviz.chart24hourmean = (function (d3, vega) {
    // Private properties
    var valField = "P1",
        dateField = "timestamp",
        dateFormat = "%-d %b %y",
        euLimitPM10 = 50,
        euLimitPM2point5 = 50,
        vegaTooltipOptions = {
            showAllFields: false,
            fields: [
                {
                    field: dateField,
                    title: "Date",
                    formatType: "time",
                    format: dateFormat + " %H:%M"
                },
                {
                    field: valField,
                    title: "Val"
                }

            ]
        },

        // Private methods
        createSpec = function (sensorId, data, valField, dateField) {
            // Creates a vega spec
            var minMaxDates, minDate, maxDate, limitValues;

            // Find the min and max dates
            minMaxDates = d3.extent(data.map(d => d[dateField]));
            minDate = minMaxDates[0];
            maxDate = minMaxDates[1];

            // Create data for EU remmended limits line
            limitValues = [
                {
                    "date": minDate,
                    "value": euLimitPM10
                },
                {
                    "date": maxDate,
                    "value": euLimitPM10
                }
            ];

            var spec = {
                "$schema": "https://vega.github.io/schema/vega/v3.json",
                "width": 500,
                "height": 200,
                "padding": 5,

                "data": [
                    {
                        "name": "table",
                        "values": data
                        // "url": "/data/luftdaten_sds011_sensor_" + sensorId + "_24_hour_means.csv",
                        // "format": {
                        //     "type": "csv",
                        //     "parse": "auto"
                        // }
                    },
                    {
                        "name": "limitEU",
                        "values": limitValues
                    }
                ],

                "scales": [
                    {
                        "name": "x",
                        "type": "time",
                        "range": "width",
                        "domain": {"data": "table", "field": dateField}
                        // "nice": true
                        // "interval": "week", "step": 1
                    },
                    {
                        "name": "y",
                        "type": "linear",
                        "range": "height",
                        "nice": true,
                        "zero": true,
                        "domain": {"data": "table", "field": valField}
                    },
                    {
                        "name": "color",
                        "type": "ordinal",
                        "range": "category",
                        "domain": {"data": "table", "field": valField}
                    },
                    {
                        "name": "colorPM",
                        "type": "ordinal",
                        "range": "category",
                        "domain": {"data": "table", "field": valField}
                    }
                ],

                "axes": [
                    {
                        "orient": "bottom",
                        "scale": "x",
                        "format": dateFormat,
                        // "format": "%-m %b %y",
                        "labelOverlap": "true"
                    },
                    {
                        "orient": "left",
                        "scale": "y"
                    }
                ],

                "marks": [
                    // {
                    //     "type": "line",
                    //     "from": {"data": "table"},
                    //     "encode": {
                    //         "enter": {
                    //             "x": {"scale": "x", "field": dateField},
                    //             "y": {"scale": "y", "field": valField},
                    //             // "stroke": {"scale": "color", "field": "c"},
                    //             "strokeWidth": {"value": 2}
                    //         },
                    //         "update": {
                    //             "fillOpacity": {"value": 1}
                    //         },
                    //         "hover": {
                    //             "fillOpacity": {"value": 0.5}
                    //         }
                    //     }
                    // },
                    // Sensor data
                    {
                        "type": "symbol",
                        "from": {"data": "table"},
                        "encode": {
                            "enter": {
                                "x": {"scale": "x", "field": dateField},
                                "y": {"scale": "y", "field": valField},
                                "fill": {"value": "#ff0000"},
                                // "stroke": {"value": "#000"},
                                // "strokeWidth": {"value": 1},
                                "size": {"value": 5}
                            }
                        }
                    },
                    // Limits
                    {
                        "type": "line",
                        "from": {"data": "limitEU"},
                        "encode": {
                            "enter": {
                                "x": {"scale": "x", "field": "date"},
                                "y": {"scale": "y", "field": "value"},
                                // "stroke": {"scale": "color", "field": "c"},
                                "strokeWidth": {"value": 2}
                            },
                            "update": {
                                "fillOpacity": {"value": 1}
                            },
                            "hover": {
                                "fillOpacity": {"value": 0.5}
                            }
                        }
                    }
                ]
            };
            return spec;
        },
        render = function (el, sensorId) {
            var dataUrl = "/website/data/luftdaten_sds011_sensor_" + sensorId + "_24_hour_means.csv";
            d3.csv(dataUrl, function(data) {
                // Set data types
                var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
                data.forEach(function(d) {
                    d[dateField] = parseDate(d[dateField]);
                    d.P1 = +d.P1;
                });

                var specCopy = createSpec(sensorId, data, valField, dateField),
                    view = new vega.View(vega.parse(specCopy))
                        .renderer('canvas')  // set renderer (canvas or svg)
                        .initialize(el) // initialize view within parent DOM container
                        .hover()             // enable hover encode set processing
                        .run();
                vegaTooltip.vega(view, vegaTooltipOptions);
            });
        };

    // Public interface
    return {
        render: render
    }
} (d3, vega));

luftviz.dayOfWeekCircular = (function (d3) {
    // Private properties
    var valueField = "P1",
        dateField = "timestamp",
        dateFormat = "%-d %b %y",

        // Private methods
        render = function (el, dataUrl) {
            d3.csv(dataUrl, function(data) {
                var valueField = "P1";

                // Set data types
                data.forEach(function(d) {
                    d.hourOfDay = +d.hourOfDay;
                    d.P1 = +d.P1;
                });
                // console.log(data[0]);

                // The data for circular heat map list of values, one for each segment,
                // spiraling out from the centre outwards. This means we need to order
                // the rows by day of week and hour of day.

                var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                // Make an lookup with order of days, e.g. {"Monday": 0, "Tuesday": 1, ...}
                var daysOrder = {};
                days.forEach( function (day, i) {
                    daysOrder[day] = i;
                });
                // console.log(daysOrder)

                // Set segment number for each day/hour (starting from Monday 00:00)
                data.forEach(function(d) {
                    d.segmentId = (daysOrder[d.dayOfWeek] * 24) + d.hourOfDay
                });

                if (data.length !== 24 * 7) {
                    throw new Error("Expected one weeks worth of data values, one for each hour of the day")
                }

                // Sort the data
                data.sort( function(a, b) {return a.segmentId - b.segmentId} );

                var chart = circularHeatChart()
                    .accessor(function(d) {return d[valueField];})
                    .segmentHeight(20)
                    .innerRadius(20)
                    .numSegments(24)
                    .radialLabels(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
                    .segmentLabels(["Midnight", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am", "Midday", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"])
                    .margin({top: 20, right: 0, bottom: 20, left: 280});

                d3.select(el)
                    .selectAll('svg')
                    .data([data])
                    .enter()
                    .append('svg')
                    .call(chart);

                    /* Add a mouseover event */
                    d3.selectAll(el + " path").on('mouseover', function() {
                    	var d = d3.select(this).data()[0],
                            txt = d.dayOfWeek + ' ' + ("0" + d.hourOfDay).slice(-2) + ':00 has value ' + d[valueField];
                        d3.select("#info").text(txt);
                    });
                    d3.selectAll(el + " svg").on('mouseout', function() {
                        d3.select("#info").text('');
                    });
            });
        };

    // Public interface
    return {
        render: render
    }
} (d3));