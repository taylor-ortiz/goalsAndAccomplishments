global class WebServiceLWC {

    @AuraEnabled (cacheable=true)
    global static WeatherData performCallout(String location) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:WeatherAPI?city=' + location + '&key=3d59d52f0fbe4e2e9ecacde26e2495ad');
        req.setMethod('GET');
        Http http = new Http();
        HTTPResponse res = http.send(req);
        JSONParser parser = JSON.createParser(res.getBody());

        WeatherData weather = new WeatherData();

        while (parser.nextToken() != null) {
            if(parser.getCurrentToken() == JSONToken.FIELD_NAME) {
                parser.nextValue();
                if (parser.getCurrentName() == 'temp') {
                    weather.cityTemp = Decimal.valueOf(parser.getText());
                } else if (parser.getCurrentName() == 'city_name') {
                    weather.cityName = parser.getText();
                } else if (parser.getCurrentName() == 'state_code') {
                    weather.state = parser.getText();
                } else if (parser.getCurrentName() == 'timezone') {
                    weather.cityTimeZone = parser.getText();
                } else if (parser.getCurrentName() == 'wind_spd') {
                    weather.cityWindSpeed = Decimal.valueOf(parser.getText());
                } else if (parser.getCurrentName() == 'lat') {
                    weather.cityLat = parser.getText();
                } else if (parser.getCurrentName() == 'lon') {
                    weather.cityLong = parser.getText();
                } else if (parser.getCurrentName() == 'precip') {
                    weather.cityPrecip = Decimal.valueOf(parser.getText());
                }
            }
        }
        System.debug('what is the value of weather? ' + weather);
        return weather;
    }
    

    global class WeatherData {
        @AuraEnabled public String cityName;
        @AuraEnabled public String cityTimeZone;
        @AuraEnabled public Decimal cityTemp;
        @AuraEnabled public String state;
        @AuraEnabled public Decimal cityWindSpeed;
        @AuraEnabled public String cityLat;
        @AuraEnabled public String cityLong;
        @AuraEnabled public Decimal cityPrecip;
    }
}
