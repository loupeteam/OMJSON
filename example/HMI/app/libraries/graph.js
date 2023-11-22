/**
 * @version 0.0.2
 * NOTE: API will change 
 */

//import * as d3 from "../../d3/dist/d3.js";
function updateD3(newdata) {
    $('div.lux-chart:visible').each(function (index, element) {
        var $this = $(this);
        var varValue = LUX.getValue($this);
        var chart = d3.select($this[0]);
        updateChart(varValue, chart);
    });
    $('svg.lux-line-chart').each(function (index, element) {
        var $this = $(this);
        // For some reasong svgs are always considered visible so check parent instead 
        if ($this.parent().is(":visible")) {
            var xVariable = $this.data("var-x");
            if ($this.data("buffer-size")) {
                var maxValues = $this.data("buffer-size") || 100,
                    varValue = bufferData($this.data("var-name"), maxValues, LUX.getValue($this));
                if (xVariable) {
                    varX = bufferData(xVariable, maxValues, LUX.getMachine($this).value(xVariable));
                    if (varX.length == 0)
                        LUX.getMachine($this).initCyclicRead(xVariable);
                }

            } else {
                var varValue = LUX.getValue($this),
                    varX = xVariable ? LUX.getMachine($this).value(xVariable) : null;
                if (!varX && xVariable)
                    LUX.getMachine($this).initCyclicRead(xVariable);
            }

            var chart = d3.select($this[0]);
            //if(checkUndefinedStrings(varValue)){
            svgUpdateLineChart({ y: varValue, x: varX }, chart, $this.attr('chart-min'), $this.attr('chart-max'));
            //}
        }
    });
    $('svg.lux-series-line-chart').each(function (index, element) {
        var $this = $(this);
        // For some reasong svgs are always considered visible so check parent instead 
        if ($this.parent().is(":visible")) {
            var data = [];
            if($this.data("buffer-size")) {
                var yVariables = $this.data("y-values"),
                xVariables = $this.data("x-values"),
                classes = $this.data("class"),
                maxValues = $this.data("buffer-size") || 100,
                xValues = [];
                if(xVariables) {
                    if(Array.isArray(xVariables)) {
                        xVariables.forEach((element)=>{
                            xValues.push(bufferData(element, maxValues, LUX.getMachine($this).value(element)));
                        });
                    } else {
                        var xBuffered = bufferData(xVariables, maxValues, LUX.getMachine($this).value(xVariables))
                        yVariables.forEach(()=>{
                            xValues.push(xBuffered);
                        });
                    }
                }
                yVariables.forEach((element, i) => {
                    data.push({
                        y: bufferData(element, maxValues, LUX.getMachine($this).value(element)),
                        x: xValues[i],
                        class: classes && Array.isArray(classes) && classes.length > i ? classes[i] : ""
                    });
                    if(data[i].y.length == 0) {
                        LUX.getMachine($this).initCyclicRead(element);
                    }
                });
            } else {
                var yVariables = $this.data("y-values"),
                xVariables = $this.data("x-values"),
                classes = $this.data("class");
                yVariables.forEach((element, i) => {
                    data.push({
                        y: LUX.getMachine($this).value(element),
                        x: xVariables ? Array.isArray(xVariables) && xVariables.length > i ? LUX.getMachine($this).value(xVariables[i]) : LUX.getMachine($this).value(xVariables) : null,
                        class: classes && Array.isArray(classes) && classes.length > i ? classes[i] : ""
                    });
                    if(!data[i].y) {
                        LUX.getMachine($this).initCyclicRead(element);
                    }
                });
            }
            
            var chart = d3.select($this[0]);
            svgUpdateSeriesLineChart(data, chart, $this.attr('chart-min'), $this.attr('chart-max'));
        }
    });
    $('svg.lux-bar-chart').each(function (index, element) {
        var $this = $(this);
        // For some reasong svgs are always considered visible so check parent instead 
        if ($this.parent().is(":visible")) {
            var chartData = {};
            chartData.yValue = checkUndefinedStrings(LUX.getValue($this));
            chartData.xValue = checkUndefinedStrings($this.attr('x-values'));
            chartData.xLabel = checkUndefinedStrings($this.attr('x-labels'));
            chartData.class = checkUndefinedStrings($this.attr('class'));
            var chart = d3.select($this[0]);
            if (chartData.yValue) {
                svgUpdateBarChart(chartData, chart, $this.attr('chart-min'), $this.attr('chart-max'));
            }
        }
    });
}

function updateChart(newdata, chart) {
    var addM = chart
        .selectAll('div')
        .data(newdata)

    addM.exit()
        .remove()

    addM.enter()
        .append("div")
        .style("height", function (d) {
            return d + "px";
        })
        .text(function (d) {
            return d;
        })

    addM.style("height", function (d) {
            return d + "px";
        })
        .text(function (d) {
            return d;
        })


}

function svgUpdateLineChart(data, chart, ymin, ymax) {

    var svg = chart,
        margin = Number($(svg._groups[0]).attr("margin")) || 50,
        width = $(svg._groups[0]).width() - margin,
        height = $(svg._groups[0]).height() - margin

    var xScale = d3.scaleLinear().range([0, width]),//.padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);

    if(data) {

        if(data.x) {
            xScale.domain([d3.min(data.x, function (d,i) {
                return d;
             }), d3.max(data.x, function (d,i) {
                return d;
             })]);
        } else if(data.y) {
            xScale.domain([d3.min(data.y, function (d,i) {
                return i;
             }), d3.max(data.y, function (d,i) {
                return i;
             })]);
        }
        else{
            return
        } 
    }
    else {
        xScale.domain([0,1]);
    }
    

    if(data && data.y){
        yScale.domain([ ymin||d3.min(data.y, function (d) {return d;}) , ymax || d3.max(data.y, function (d) {return d;})]);    
    }
    else {
        yScale.domain([ ymin||0, ymax||1]);
    }

    var g = svg.select("g")

    ////////////////
    //Update scales
    g.selectAll(".yAxis")
        .call(d3.axisLeft(yScale).tickFormat(function (d) {
            return d;
        }).ticks(10));

    g.selectAll(".xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    ////////////////


    var lineBuilder = d3.line()
        .x(function (d, index) {
            return xScale(data.x ? data.x[index] : index);// + xScale.bandwidth() / 2;
        })
        .y(function (d) {
            return yScale(d);
        });


    //Update line graph    
    var line = g.select(".line") // change the line

    line
        .datum(data.y)
        .attr("d", lineBuilder)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5);
}

// data: [{y: [num,...], x: [num,...] | null, class: ["",...]},...]
function svgUpdateSeriesLineChart(datas, chart, ymin, ymax) {

    var svg = chart,
        margin = Number($(svg._groups[0]).attr("margin")) || 50,
        width = $(svg._groups[0]).width() - margin,
        height = $(svg._groups[0]).height() - margin

    var xScale = d3.scaleLinear().range([0, width]),//.padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);


    var allData = { y: [], x: [] };

    datas.forEach(data => {
        allData.y = allData.y.concat(data.y);
        allData.x = allData.x.concat(data.x);
    })
    xScale.domain([d3.min(allData.x, function (d, i) {
        return d ? d : 0;
    }), d3.max(allData.x, function (d, i) {
        return d ? d : datas[0].y.length;
    })]);

    yScale.domain([ymin || d3.min(allData.y, function (d) { return d; }), ymax || d3.max(allData.y, function (d) { return d; })]);


    var g = svg.select("g")

    ////////////////
    //Update scales
    g.selectAll(".yAxis")
        .call(d3.axisLeft(yScale).tickFormat(function (d) {
            return d;
        }).ticks(10));

    g.selectAll(".xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    ////////////////


    var color;
    datas.forEach(data => {
        if (data.y) {
            var lineBuilder = d3.line()
                .x(function (d, index) {
                    return xScale( data.x ? data.x[index] : index);// + xScale.bandwidth() / 2;
                })
                .y(function (d,index) {
                    return yScale(data.y[index]);
                });


            //Update line graph    
            var line = g.select("." + String(data.class ? data.class : "")) // change the line
            if (line.empty()) {
                line = g.append("path").attr("class", "line " + String(data.class ? data.class : ""))
            }

            line
                .datum(data.y)
                .attr("d", lineBuilder)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5);

        }
    });
}

// data: {value:[{y: num, x: num}] class: [] }
function svgUpdateBarChart(data, chart,ymin,ymax) {

    // check for invalid object
    if(!data) {
        data = {};
    }

    var svg = chart,
        margin = Number($(svg._groups[0]).attr("margin")) || 50,
        width = $(svg._groups[0]).width() - margin,
        height = $(svg._groups[0]).height() - margin

    var xScale = d3.scaleLinear().range([0, width]),//.padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);


    var g = svg.select("g")

    // Update data set
    var dataSet = g.selectAll("." + String(data.class ? Array.isArray(data.class) ? data.class[0] : data.class : ""))
    .data(data.value)
    dataSet.exit().remove();
    
    var bars = g.selectAll(".bar");
    
    var allData = bars.data();
    allData = allData.concat(data.value);
    xScale.domain([d3.min(allData, function (d) { return d.x; }), d3.max(allData, function (d) { return d.x; })]);
    yScale.domain([ymin || d3.min(allData, function (d) { return d.y; }), ymax || d3.max(allData, function (d) { return d.y; })]);

    ////////////////
    //Update scales
    g.selectAll(".yAxis")
        .call(d3.axisLeft(yScale).tickFormat(function (d) {
            return d;
        }).ticks(10));

    g.selectAll(".xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).tickFormat(function (d) {
            return d;
        }).ticks(16));
    ////////////////

    var barWidth=20;
    // Update bars
    dataSet
        .enter()
        .append("rect")
        .attr("class", function (d, index) {
            return "bar " + String(data.class ? Array.isArray(data.class) && data.class.length > index ? data.class[index] : data.class : "");
        })
        .attr("x", function (d, index) {
            return xScale(d.x) - barWidth/2;
        })
        .attr("y", function (d) {
            return yScale(d.y);
        })
        .attr("width", barWidth)
        .attr("height", function (d) {
            return 5;
        });



    bars
        // .attr("class", function (d, index) {
        //     return "bar " + String(data.class ? Array.isArray(data.class) && data.class.length > index ? data.class[index] : data.class : "");
        // })
        .attr("x", function (d, index) {
            return xScale(d.x) - barWidth/2;
        })
        .attr("y", function (d) {
            return yScale(d.y);
        })
        .attr("width", barWidth)
        .attr("height", function (d) {
            return 5;
        });
}

function initSvgChart() {
    var svg = d3.selectAll("svg.lux-line-chart,svg.lux-bar-chart,svg.lux-init-chart,svg.lux-series-line-chart"),
        margin = 200,
        width = svg.attr("width") - margin,
        height = svg.attr("height") - margin

    var xScale = d3.scaleBand().range([0, width]).padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);

    svg.call( d3.drag()
        .on("start", function() { d3.event.sourceEvent.stopPropagation(); })
        .on("drag", function() { 
            svg.attr('ymax',10)
        })
    )

    var g = svg.append("g").attr("transform", "translate(" + 40 + "," + 10 + ")");

    xScale.domain([1, 1].map(function (d, index) {
        return index;
    }));
    yScale.domain([0, 100]);

    //Create scales
    g.append("g")
        .attr('class', "xAxis")

    g.append("g")
        .attr('class', "yAxis")

    //Create line for line graph
    g.append("path").
    attr("class", "line") // Add the valueline path.

}

function initGraphs() {
    initSvgChart();

    LUX.on({
        'update-hmi': function () {
            updateD3();
        }
    })
}

if(typeof d3 === 'undefined'){
        import("../../d3/dist/d3.js").then((d3)=>{
            initGraphs();
        })
}
else{
    initGraphs();
}

function checkUndefinedStrings(value) {
    if(value === "undefined")
        return value = undefined;
}

var bufferedData = {};
function bufferData(dataSet, maxValues, value) {
    if(!bufferedData[dataSet])
        bufferedData[dataSet]=[];
    
    if(typeof value == 'number')
        bufferedData[dataSet].push(value);
    
    if(bufferedData[dataSet].length > maxValues) {
        bufferedData[dataSet] = bufferedData[dataSet].slice(bufferedData[dataSet].length-maxValues);
    }

    return bufferedData[dataSet];
}