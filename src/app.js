const express = require('express');
const path = require('path');
const hbs = require('hbs');
const request = require('request');
const geocode = require('./utils/geocode');
const temperature = require('./utils/temperature');

const app = express();

app.set('view engine', 'hbs');
const homeDirectryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.use(express.static(homeDirectryPath));
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

app.get('', (req, res)=>{
    res.render('index', {
        title: 'Weather'
    });
});

app.get('/about', (req, res)=>{
    res.render('about', {
        title: 'About'
    });
});

app.get('/help', (req, res)=>{
    res.render('help', {
        message: 'This is a help message',
        title: 'Help'
    });
});

app.get('/weather', (req, res) => {
    if(!req.query.address) {
        return res.send({
            error: 'You have to provide a valid address'
        });
    }

    geocode(req.query.address, (error, {longitude, latitude, place_name}={})=>{
        if(error) {
            return res.send({
                error: error
            })
        }
    
        temperature(`${latitude}, ${longitude}`, (error, temperatureData)=> {
            if(error) {
                return res.send({
                    error: error
                });
            }
    
            res.send({
                weather: temperatureData,
                location: place_name,
                address: req.query.address
            });
        })
    });
})

app.get('/help/*', (req, res) => {
    res.render('404', {
        error: 'Help page not found',
        title: 'Error: Not found'
    });
});

app.get('*', (req, res) => {
    res.render('404', {
        error: '404 page error',
        title: 'Error: Not found'
    });
});

app.listen(3000, ()=>{
    console.log(`Express is up and running`);
});

