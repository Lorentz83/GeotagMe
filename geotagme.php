<?php
/*
Plugin Name: GeotagMe
Plugin URI: https://github.com/Lorentz83/GeotagMe
Description: GeotagMe extracts geotag metadata from the pictures in a page and uses them to show the pictures in an interactive map
Version: 0.1
Author: Lorenzo Bossi
Author URI: http://profiles.wordpress.org/lorentz83
License: GPL2 or later
*/

/**
 *  Copyright (C) 2014 Lorenzo Bossi
 *
 *  This file is part of GeotagMe
 *
 *  GeotagMeis free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published
 *  by the Free Software Foundation, either version 2 of the License,
 *  or (at your option) any later version.
 *
 *  GeotagMe is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 *  See the GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with GeotagMe
 *  If not, see <http://www.gnu.org/licenses/>.
 */

class GeotagMe {
  var $version = "0.1";
  var $name = "GeotagMe";
  var $id = "geotagme";
  var $shortcodeTag = "GeotagMe";
  
  // options
  var $googleMapsApiV3Key;
  var $geotagMeAutoenableOnTags;

  function GeotagMe(){ //ctor
    add_shortcode( $this->shortcodeTag, array( &$this, 'shortcode' ) );
    add_action( 'wp_enqueue_scripts', array( &$this, 'add_scripts' ) );
    add_action( 'admin_menu', array( &$this, 'custom_admin_menu' ) );
    
    $this->googleMapsApiV3Key = get_option("googleMapsApiV3Key", "");
    $this->geotagMeAutoenableOnTags = get_option("geotagMeAutoenableOnTags", array());

    $plugin = plugin_basename(__FILE__); 
    add_filter("plugin_action_links_$plugin", array( &$this, 'add_link_to_settings' ) );

    add_action('the_content', array( &$this, 'add_in_post_with_tag' ) );

  }

  function add_in_post_with_tag($content) {
    if ( is_single() ) {
      global $post;
      $tags = wp_get_post_tags($post->ID, array( 'fields' => 'ids' ));
      foreach ( $this->geotagMeAutoenableOnTags as $toShow ) {
	if ( in_array( $toShow, $tags ) ) {
	  $content .= '<p style="clear:both">'.$this->get_open_link().'</p>';
	  break;
	}
      }
    }
    return $content;
  }

  function add_link_to_settings($links) { 
    $settings_link = '<a href="options-general.php?page='.$this->id.'.php">'.__('Settings').'</a>'; 
    array_unshift($links, $settings_link); 
    return $links; 
  }
 
  function custom_admin_menu() {
    add_options_page( "Options", $this->name, 'manage_options', $this->id, array( &$this, 'custom_options' ) );
  }
  
  function custom_options() {
    if ( !current_user_can( 'manage_options' ) )  {
      wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
    }
    
    if( isset($_POST["googleMapsApiV3Key"]) ){
      $this->googleMapsApiV3Key = $_POST["googleMapsApiV3Key"];
      update_option( "googleMapsApiV3Key", $this->googleMapsApiV3Key );
      $updated = __("Changes saved.");
    }
    if( isset($_POST["geotagMeAutoenableOnTags"]) ){
      $this->geotagMeAutoenableOnTags = $_POST["geotagMeAutoenableOnTags"];
      update_option( "geotagMeAutoenableOnTags", $this->geotagMeAutoenableOnTags );
      $updated = __("Changes saved.");
    }
    
    echo '<div class="wrap">';
    screen_icon();
    echo "<h2>$this->name</h2>";
    if ( isset($updated) ) 
      echo '<div class="updated fade"><p>'.$updated.'</p></div>';
    echo "<h3>".__("Google maps settings")."</h3>";
    echo '<form method="post" action="">';
    echo "<p>";
    echo '<label for="googleMapsApiV3Key">'.__("Google Maps API v3 key (optional)", $this->id).'</label>: ';
    echo '<input type="text" value="'.$this->googleMapsApiV3Key.'" name="googleMapsApiV3Key" id="googleMapsApiV3Key" size="40" /> ';
    echo '(<a href="https://developers.google.com/maps/documentation/javascript/tutorial#api_key">'.__('How to obtain?').'</a>)';
    echo "</p>";
    echo "<h3>".__("Open map settings")."</h3>";
    printf(__("<p>Write %s or %sLink text%s anywhere in a post to insert a link to open the map."), 
	   "<code>[$this->shortcodeTag]</code>",
	   "<code>[$this->shortcodeTag]",
	   "[/$this->shortcodeTag]</code>");
    echo "<p>";
    echo '<label for="geotagMeAutoenableOnTags">'.
      __("Automatically show a link to open the map at the bottom of the posts with these tags (hold ctrl for multiple selection)").
      "</label> ";
    echo '<a href="#" onclick="jQuery(\'#geotagMeAutoenableOnTags\').val([]); return false">'.__("Clear selection").'</a><br/>';
    echo '<select name="geotagMeAutoenableOnTags[]" id ="geotagMeAutoenableOnTags" multiple="true" size="10">';
    foreach ( get_tags() as $tag ) {
      $selected =  in_array( $tag->term_id, $this->geotagMeAutoenableOnTags ) ? 'selected="selected"' : '';
      echo '<option '.$selected.' value="'.$tag->term_id.'">'.$tag->name.'</option>';
    }
    echo '</select>';
    echo '</p>';
    submit_button();
    echo '</form>';
  }

  function add_scripts() {
    $jsDep = array("jquery", "jquery-ui-dialog", "jquery-ui-progressbar", "GoogleMapsAPIv3", "ExifReader", "OverlappingMarkerSpiderfier");
    $noDep = array();

    if ( empty($this->googleMapsApiV3Key) )
      $gmapScriptURL = "//maps.googleapis.com/maps/api/js?sensor=false";
    else
      $gmapScriptURL = "//maps.googleapis.com/maps/api/js?key=$this->googleMapsApiV3Key&sensor=false";
    
    
    wp_enqueue_script("GoogleMapsAPIv3", $gmapScriptURL, $noDep);
    wp_enqueue_script("OverlappingMarkerSpiderfier", plugins_url( "js/oms.min.js" , __FILE__ ), array("GoogleMapsAPIv3"), $this->version, false);
    wp_enqueue_script("ExifReader", plugins_url( "js/ExifReader.js" , __FILE__ ), $noDep, $this->version, false);
    wp_enqueue_script("GeotagMe", plugins_url( "js/picstomap.js" , __FILE__ ), $jsDep, $this->version, false);
    
    wp_enqueue_style("jquery-style", plugins_url( 'style/jquery-ui-1.10.3.custom.min.css' , __FILE__ ), array(), $this->version ); 
  }

  function shortcode( $atts, $content) {
    return $this->get_open_link($content);
  }

  function get_open_link($content = null){
    if ($content == null)
      $content = __("Click here to show the map");
    return '<a href="#" class="GeotagMe_open_map">'.$content.'</a>';
  }
}

new GeotagMe();
