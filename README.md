# StreetViewSafari

Street View Safari was a webapp which I build on the [Parse](https://www.parse.com/) service. It was hosted at www.streetviewsafari.com for about a year from Summer 2014 to Summer 2015. 

The idea behind SVS was to find interesting panoramas taken by the Google Street View service. Users would log their finds to be voted and commented on. These panoramas could be related but not limied to something funny, interesting road signs and camera glitches.

The application was composed of two main sections. First, the Google Street View and secondly a map, which showed locations of the snapped locations.

## Lessons learned:
* Don't tie yourself to a service. Use interfaces so that you can switch data providers.
* Google Street View updates frequently and you cannot access historical images using the Maps API. There was no realible way to know when the images were updated and the context of the original panorama lost.

## Technologies used:
* Written in Typescript
* Facebook Parse API for user and data management
* Knockout for binding engine
* Promises (Bluebird)
* Google Maps JS API

The project was originally stored in a private repo owned by [Jason](https://github.com/jasonscharf) who helped me get up and running with Git.
