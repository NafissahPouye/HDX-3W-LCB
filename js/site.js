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
    var datatabGraphe = dc.dataTable('#datatab');
    var datatabGraph = dc.dataTable('#datatab1');


    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whatDimension = cf.dimension(function(d){ return d[config.whatFieldName]; });
    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });
    var whoGroup = whoDimension.group().reduceSum(function(d){ return d[config.sumField]; });
    var whatGroup = whatDimension.group();
    var whereGroup = whereDimension.group();
    var whoGroup1 = whoDimension.group().reduceCount();

    var all = cf.groupAll();

    var sumdim =  cf.dimension(function(d){ return d[config.sumField]; });
    var sumgroup = sumdim.group().reduceSum(function(d){return d[config.sumField]; });

    var nbdim = cf.dimension(function(d){return d[config.nbField];});
    var nbgroup = nbdim.group().reduceSum(function(d){return d[config.nbField];});

//datatable
    datatabGraphe.dimension(whoDimension)
        .group(function (d) {
            return d.whoGroup;
        })
        .columns([
                function (d) {
                return d.Country;
            },
                function (d) {
                return d.Admin1;
            },
                    function (d) {
                return d.sector;
            },
                    function (d) {
                return d.orga;
            }
                ])
        .sortBy(function (d) {
            return d[config.whoFieldName];
        });

    //fin datatable
    //datatable1 testing
    var test =[
  {
    "adm": "Adamawa",
    "CCCM": 1,
    "FSC": 9,
    "Coordination": 10,
    "Education": 11,
    "Nutrition": 14
  },
  {
    "adm": "Diffa",
    "CCCM": 6,
    "FSC": 7,
    "Coordination": 8,
    "Education": 9,
    "Nutrition": 9
  }
];
var ndx = crossfilter(test);
    var dim = ndx.dimension(function (d){ 
        console.log(d.adm);
        return d.adm;});
    var gp = dim.group();//.reduceSum(function(d){ return d.CCCM;});

    datatabGraph.dimension(dim)
                // .group(gp)
        .group(function (d) {
            d.CCCM;
        })
        .columns([
               /* function (d) {
                return d.Country;
            },*/
                function (d) {
                return d.adm;
            },
                    function (d) {
                return d.CCCM;
            },
                    function (d) {
                return d.FSC;
            },
                    function (d) {
                return d.Coordination;
            },
                    function (d) {
                return d.Education;
            },
                    function (d) {
                return d.Nutrition;
            }
                ])
        .sortBy(function (d) {
            return d.adm;
        });

    //fin datatable

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
                "present in " + d.value + " regions"].join('\n')})
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


    whereChart.width($('#hxd-3W-where').width()).height(360)
            .dimension(whereDimension)
            .group(whereGroup)
            .center([0,0])
            .zoom(0)
            .geojson(geom)
            .colors(['#DDDDDD','#A7C1D3','#71A5CA','#3B88C0', '#056CB6'])
            .renderTitle(true)
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
            })

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
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
            lookup[e.properties[config.joinAttribute]] = e.properties[config.nameAttribute];
        });
        return lookup;
    }
}


var dataCall = $.ajax({
    type: 'GET',
    url: config.data,
    dataType: 'json',
});


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