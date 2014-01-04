name : memapper

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

== Installation ==

1. Upload the directory `geotagged-pics-to-map` to the `/wp-content/plugins/` directory
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

= 0.1 =
* First release!

== Upgrade Notice ==

