name : GeotagMe

=== Plugin Name ===
Contributors: lorentz83
Tags: geotag, pictures, photos, map
Requires at least: 3.5
Tested up to: 3.6
Stable tag: trunk
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

This plugin can show the pictures present on a page in a nice map. 
It takes the coordinate directly from the EXIF metadata of the jpeg
files.

== Description ==

This plugin can show the pictures present on a page on Google Maps. 
It takes the coordinate directly from the EXIF metadata of the jpeg
files.

Note that the extraction of the metadata is made via javascript client
side, so a newer browser is required to support the functionality.

GeotagMe is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 2 of the License, or (at your
option) any later version.

GeotagMe includes
[OverlappingMarkerSpiderfier](https://github.com/jawj/OverlappingMarkerSpiderfier),
[ExifReader](https://github.com/mattiasw/ExifReader) and 
[jQuery UI](http://jqueryui.com/) as libraries. 
They are released under GPL-compatible licenses, check
their project websites to obtain more detailed information.

== Installation ==

1. Upload the directory `geotagme` to the `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress
1. Optionally, obtain a Google Maps Api V3 Key and save it in the
   option page

== Frequently Asked Questions ==

= Do i need a Google Maps Api V3 Key  =

With the key you can easily monitor the usage of the Google Maps
service, and you have also an higher quota as registered user.
For more information check the page
https://developers.google.com/maps/documentation/javascript/tutorial#api_key

= Why your plugin doesn't (always) work? =

It require newer browser to support the download and the parse of the
image to extract the GPS coordinates. 
If also with a new browser doesn't work please send a bug report, a
link to the website where you intend to use it will be appreciate.

== Screenshots ==

1. This screen shot description corresponds to screenshot-1.(png|jpg|jpeg|gif). Note that the screenshot is taken from
the /assets directory or the directory that contains the stable readme.txt (tags or trunk). Screenshots in the /assets 
directory take precedence. For example, `/assets/screenshot-1.png` would win over `/tags/4.3/screenshot-1.png` 
(or jpg, jpeg, gif).
2. This is the second screen shot

== Changelog ==

= 0.1beta =
* First release!

== Upgrade Notice ==

