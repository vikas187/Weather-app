const request = require('request');
const csvtojson = require('csvtojson');
const cheer = require('cheerio');
const utils = require('./utils');
const ObjectsToCsv = require('objects-to-csv');

csvtojson()
.fromFile('./claims.csv')
.then(async jsonObj =>{
    for(let i=0;i<jsonObj.length;i++){
      const updateList = new Promise((resolve, reject)=>{
        let options = {
          'method': 'POST',
          'url': 'http://www.vahealthprovider.com/search_results.asp',
          'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'ASPSESSIONIDQSRCSCDS=BPOBAFNAEBFAKENCHNODPMAB'
          },
          form: {
            'last_Name': jsonObj[i].lastname,
            'county': 'Any',
            'speciality': 'Any',
            'Submit': 'Search'
          }
        };
        request(options, function (error, response) { 
          if (error) reject(error);
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
          //this code will be running in background
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
                  if(value3.indexOf('Date') !== -1) {
                    let dateIndex = value3.indexOf('Date');
                    value3 = value3.substring(dateIndex);
                    value3 = value3.replace(/,/g, '');
                    value3 = value3.replace(/\n/g, ',');
                    value3 = "[{" + value3;
                    value3 = value3.replace(/,Date/g, '},{Date');
                    value3 = value3 + "}]";
                    value3 = utils.extractObject(value3);
                    value3.forEach(obj=>{
                      const details = {
                        "name": name,
                        "Liscene No": url,
                        "Felony Conviction Information":value1,
                        "Virginia Board of Medicine Notices and Orders":value2,
                        ...obj
                      }
                      detailsArray.push(details);
                    });
                  } else {
                    const details = {
                      "name": name,
                      "Liscene No": url,
                      "Felony Conviction Information":value1,
                      "Virginia Board of Medicine Notices and Orders":value2,
                      "Date": "",
                      "Entity Taking Action": "",
                      "Action Taken": ""
                    }
                    detailsArray.push(details);
                  }
    
                  if(count===urls.length) {
                    resolve(detailsArray);
                  }
                }
              });
            });
          }).then((data)=>{
            const csv = new ObjectsToCsv(data);
            const saveCsv = async()=>{
              await csv.toDisk('./list.csv', {append: true});
            }
            saveCsv().then(()=>resolve('File saved successfully')).catch((ex)=>reject(ex));
          }).catch(ex=>{
            reject(ex);
            return;
          });
        }); 
      }).then(data=>{
        console.log(data);
      }).catch(ex=>{
        console.log(ex);
      });

      await updateList;
    }   
});
