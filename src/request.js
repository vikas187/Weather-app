var request = require('request');
var options = {
  'method': 'POST',
  'url': 'http://www.vahealthprovider.com/search_results.asp',
  'headers': {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': 'ASPSESSIONIDQSRCSCDS=BPOBAFNAEBFAKENCHNODPMAB'
  },
  form: {
    'last_Name': 'mark',
    'county': 'Any',
    'speciality': 'Any',
    'Submit': 'Search'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  body = response.body;
  console.log(typeof(body));
  var regex = /license_no/gi, result, indices = [], urls=[];
    while ( (result = regex.exec(body)) ) {
        indices.push(result.index);
    }
    indices.forEach((index)=>{
        var i=index;
        var str="";
        while(body.charAt(i)!='>') {
            str += body[i];
            i++;
        }
        urls.push(str);
    });
    console.log(urls);
    urls.forEach(url=>{
        var options = {
            'method': 'GET',
            'url': `http://www.vahealthprovider.com/results_acad.asp?${url}`,
            'headers': {
                'Cookie': 'ASPSESSIONIDQSRCSCDS=CIBCAFNAHOHEHHOAFMNPCGDB'
            }
        };
        request(options, function (error, response) { 
            if (error) throw new Error(error);
            console.log(response.body);
        });
    })

});

console.log('hello');