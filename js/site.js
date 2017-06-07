

var config = {
    title:" 3W Dashboard",
    description:"Who is doing What, Where in response to the Lake Chad Basin crisis",
    data:"data/lcbdata.json",
    whoFieldName:"orga",
    whatFieldName:"sector",
    whereFieldName:"Pcodes",
    sumcount: true,
    sum: true,
    nb: true,
    nbField: "nb",
    sumField:"presence",
    sumcountField:"count",
    geo:"data/lcb.geojson",
    joinAttribute:"Rowcacode1",
    nameAttribute:"ADM1_NAME",
    color:"#03a9f4"
};

function generate3WComponent(config,data,geom){
    
    var lookup = genLookup(geom,config);
    
    $('#title').html(config.title);
    $('#description').html(config.description);

    var whoChart = dc.rowChart('#hdx-3W-who');
    var whatChart = dc.rowChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');
   // var sumChart = dc.numberDisplay('#count-info')

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whatDimension = cf.dimension(function(d){ return d[config.whatFieldName]; });
    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });
    var whoGroup = whoDimension.group().reduceSum(function(d){ return d[config.sumField]; });
    var whatGroup = whatDimension.group().reduceSum(function(d){ return d[config.sumcountField]; });
    var whereGroup = whereDimension.group().reduceSum(function(d){ return d[config.sumField]; });  
    var whoGroup1 = whoDimension.group().reduceCount();     
    
    var all = cf.groupAll();

    var sumdim =  cf.dimension(function(d){ return d[config.sumField]; });
    var sumgroup = sumdim.group().reduceSum(function(d){return d[config.sumField]; });

    var nbdim = cf.dimension(function(d){return d[config.nbField];});
    var nbgroup = nbdim.group().reduceSum(function(d){return d[config.nbField];});

     /*sumChart
       .valueAccessor(function(d){return d.value})
       .group(nbgroup);*/
/*sumChart.on("renderlet", function(chart){
    // mix of dc API and d3 manipulation
    chart.select('g.y').style('display', 'none');
    // its a closure so you can also access other chart variable available in the closure scope
    moveChart.filter(chart.filter());
});*/
       
/*
  function myFunction() {
     sumChart
       .valueAccessor(function(d){return d.value})
       .group(nbgroup);
    document.getElementById("count-info").innerHTML = "click";
    return sumChart;
    alert("organisations");
}*/
        

    whoChart.width($('#hxd-3W-who').width()).height(400)
            .dimension(whoDimension)
            .group(whoGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .title(function(d){return [ 
                d.value + " areas"].join('\n')})
            .xAxis().ticks(5);

    whatChart.width($('#hxd-3W-what').width()).height(400)
            .dimension(whatDimension)
            .group(whatGroup)
            .elasticX(true)
            .title(function(d){return [ 
                d.value + " organisations"].join('\n')})
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .title(function(d){return [ 
                d.value + " organisations"].join('\n')})
            .xAxis().ticks(5);

   /* dc.dataCount('#count-info')
           .dimension(cf)
           .group(all);*/

    whereChart.width($('#hxd-3W-where').width()).height(360)
            .dimension(whereDimension)
            .group(whereGroup)
            .center([0,0])
            .zoom(0)    
            .geojson(geom)
            .colors(['#DDDDDD','#A7C1D3','#71A5CA','#3B88C0', '#056CB6'])
            .label(function (p) { return p.key; })
            .colorDomain([0,4])
            .colorAccessor(function (d) {
                var c =0
                if(d>25){
                    c=4;
                } else if (d>16) {
                    c=3;
                } else if (d>6) {
                    c=2;
                } else if (d>0) {
                    c=1;
                };
                return c
                
            })                  
            .featureKeyAccessor(function(feature){
                return feature.properties[config.joinAttribute];
            }).popup(function(d){
                return lookup[d.key];
            })
            .renderPopup(true)
             .featureOptions({
                'fillColor': 'gray',
                'color': 'gray',
                'opacity':0.8,
                'fillOpacity': 0.1,
                'weight': 1
            });
    dc.renderAll();
    
    
    var map = whereChart.map();

    zoomToGeom(geom);

    if(config.sum){
        var axisText = config.sumField.substr(1);
    } else {
        var axisText = 'Activities';
    }
    
    
    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }
    
    function genLookup(geojson,config){
        var lookup = {};
        geojson.features.forEach(function(e){
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]) + nbgroup;
        });
        return lookup;
    }
}


var dataCall = $.ajax({ 
    type: 'GET', 
    url: config.data, 
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({ 
    type: 'GET', 
    url: config.geo, 
    dataType: 'json',
});

//when both ready construct 3W

$.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
    var geom = geomArgs[0];
    geom.features.forEach(function(e){
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
    });
    generate3WComponent(config,dataArgs[0],geom);
});