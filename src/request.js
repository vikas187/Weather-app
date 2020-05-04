const request = require('request');
const cheer = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');
let options = {
  'method': 'POST',
  'url': 'http://www.vahealthprovider.com/search_results.asp',
  'headers': {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': 'ASPSESSIONIDQSRCSCDS=BPOBAFNAEBFAKENCHNODPMAB'
  },
  form: {
    'last_Name': '123',
    'county': 'Any',
    'speciality': 'Any',
    'Submit': 'Search'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  body = response.body;
  let regex = /license_no/gi, result, indices = [], urls=[];
    while ( (result = regex.exec(body)) ) {
        indices.push(result.index);
    }
    indices.forEach((index)=>{
        let i=index;
        let str="";
        while(body.charAt(i)!='>') {
            str += body[i];
            i++;
        }
        urls.push(str);
    });
    console.log("urls count" +urls.length);
    //urls = urls.slice(0,1);
    const getDetailsArray = new Promise((resolve, reject)=>{
      let detailsArray=[];
      if(urls.length==0) {
        reject("No results found");
      }
      let count=0;
      urls.forEach(url=>{
        let options = {
            'method': 'GET',
            'url': `http://www.vahealthprovider.com/results_act.asp?${url}`,
            'headers': {
                'Cookie': 'ASPSESSIONIDQSRCSCDS=CIBCAFNAHOHEHHOAFMNPCGDB'
            }
        };
        request(options, function (error, response) { 
            count++;
            if (error) reject(error);
            if(response.body) {
              let html = response.body;
              const name = html.substring(html.indexOf("Practitioner Name")+19, html.indexOf(",", html.indexOf("Practitioner Name")));
              //console.log(name);
              const tableIndex = html.indexOf("<Table");
              const tableEndIndex = html.indexOf("</table>", tableIndex);
              html = html.substring(tableIndex, tableEndIndex+8);
              html = html.replace('id="subtext"', "");
              html = html.replace('id="subtext"', 'id="note1"');
              html = html.replace('id="notetext"', 'id="note2"');
              html = html.replace('id="subtext"', 'id="note3"');
              let $ = cheer.load(html);
              const note1 = $('#note1').text();
              const note2 = $('#note2').text();
              const note3 = $('#note3').text();
              html = html.replace(note1, '');
              html = html.replace(note2, '');
              html = html.replace(note3, '');
              html = html.replace("Felony Conviction Information", '');
              html = html.replace("Virginia Board of Medicine Notices and Orders", '');
              html = html.replace("Actions Taken by States/Organizations Other than the Virginia Board of Medicine", '');
              html = html.replace('resbox', 'value1');
              html = html.replace('resbox', 'value2');
              html = html.replace('resbox', 'value3');
              $ = cheer.load(html);
              let value1 = $('#value1').text().trim();
              let value2 = $('#value2').text().trim();
              let value3 = $('#value3').text().trim();
              const details = {
                "name": name,
                "Liscene No": url,
                "Felony Conviction Information":value1,
                "Virginia Board of Medicine Notices and Orders":value2,
                "Actions Taken by States/Organizations Other than the Virginia Board of Medicine": value3,
                "Paid Claims in the last ten years": ""
              }

              detailsArray.push(details);

              if(count===urls.length) {
                resolve(detailsArray);
              }
            }
          });
      });
    }).then(detailsArray=>{
      return new Promise((resolve,reject) => {
        let count=0;
         urls.forEach(url=>{
          let options = {
            'method': 'GET',
            'url': `http://www.vahealthprovider.com/results_paid.asp?${url}`,
            'headers': {
                'Cookie': 'ASPSESSIONIDCQDTSDAS=LDDGKBEDFKDICPFEALNCJFKG'
              }
          };
          request(options, (error, response)=>{
            if(error) return reject(error);
            if(response.body) {
              let html = response.body;
              //console.log(html);
              const tableIndex = html.indexOf("<Table");
              const tableEndIndex = html.indexOf("</table>", tableIndex);
              html = html.substring(tableIndex, tableEndIndex+8);
              html = html.replace("Paid Claims in the last ten years", "");
              html = html.replace("subtext", "note1");
              html = html.replace("subtext", "note2");
              let $ = cheer.load(html);
              const note2 = $('#note2').text();
              html = html.replace(note2, "");
              $ = cheer.load(html);
              let value1 = $('#resbox').text().trim();
              console.log(value1);
              detailsArray[count]["Paid Claims in the last ten years"] = value1;
              count++;
              if(count==urls.length) {
                return resolve(detailsArray);
              }
            }
          })
        });
      });   
    }).then((data)=>{
      const csv = new ObjectsToCsv(data);
      const saveCsv = async()=>{
        await csv.toDisk('./list.csv');
      }
      saveCsv().then(()=>console.log('File saved successfully')).catch((ex)=>console.log(ex));
    }).catch(ex=>{
      console.log(ex);
    });

});
