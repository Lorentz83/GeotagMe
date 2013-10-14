<?php
/*
Plugin Name: Geotagged Pics to Map
Plugin URI: http://URI_Of_Page_Describing_Plugin_and_Updates
Description: Show the pictures in a page on Google Maps
Version: 0.1
Author: lorentz83
Author URI: http://profiles.wordpress.org/lorentz83
License: GPL2
*/


class geotagged_pics_to_map {
  var $version = "0.1";
  var $googleMapsApiV3Key;
  var $name = "Geotagged Pics to Map";
  var $id = "geotagged-pics-to-map";
  var $pics2mapTags = array();

  function geotagged_pics_to_map(){ //ctor
    add_shortcode( 'pics2map', array( &$this, 'shortcode' ) );
    add_action( 'wp_enqueue_scripts', array( &$this, 'add_scripts' ) );
    add_action( 'admin_menu', array( &$this, 'custom_admin_menu' ) );
    
    $this->googleMapsApiV3Key = get_option("googleMapsApiV3Key");
    $this->pics2mapTags = get_option("pics2mapTags");

    $plugin = plugin_basename(__FILE__); 
    add_filter("plugin_action_links_$plugin", array( &$this, 'add_link_to_settings' ) );

    add_action('the_content', array( &$this, 'add_in_post_with_tag' ) );

  }

  function add_in_post_with_tag($content) {
    if ( is_single() ) {
      global $post;
      $tags = wp_get_post_tags($post->ID, array( 'fields' => 'ids' ));
      foreach ( $this->pics2mapTags as $toShow ) {
	if ( in_array( $toShow, $tags ) ) {
	  $content .= '<p>'.$this->get_open_link().'</p>';
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
    if( isset($_POST["pics2mapTags"]) ){
      $this->pics2mapTags = $_POST["pics2mapTags"];
      update_option( "pics2mapTags", $this->pics2mapTags );
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
    echo '<label for="googleMapsApiV3Key">'.__("Google Maps API v3 key", $this->id).'</label>: ';
    echo '<input type="text" value="'.$this->googleMapsApiV3Key.'" name="googleMapsApiV3Key" id="googleMapsApiV3Key" size="40" /> ';
    echo '(<a href="https://developers.google.com/maps/documentation/javascript/tutorial#api_key">'.__('How to obtain?').'</a>)';
    echo "</p>";
    echo "<h3>".__("Tag settings")."</h3>";
    echo "<p>";
    echo '<label for="pics2mapTags">'.__("Automatically show a link to open the map at the bottom of the posts with these tags (hold ctrl for multiple select)")."</label> ";
    echo '<a href="#" onclick="jQuery(\'#pics2mapTags\').val([]); return false">'.__("Clear selection").'</a><br/>';
    echo '<select name="pics2mapTags[]" id ="pics2mapTags" multiple="true" size="10">';
    foreach ( get_tags() as $tag ) {
      $selected =  in_array( $tag->term_id, $this->pics2mapTags ) ? 'selected="selected"' : '';
      echo '<option '.$selected.' value="'.$tag->term_id.'">'.$tag->name.'</option>';
    }
    echo '</select>';
    echo '</p>';
    submit_button();
    echo '</form>';
  }

  function add_scripts() {
    // $proto = ($_SERVER['HTTPS'] && $_SERVER['HTTPS']!="off") ? "https" : "http";
    $jsDep = array("jquery", "jquery-ui-dialog", "jquery-ui-progressbar", "GoogleMapsAPIv3", "ExifReader", "OverlappingMarkerSpiderfier");
    $noDep = array();

    if ( empty($this->googleMapsApiV3Key) )
      $gmapScriptURL = "//maps.googleapis.com/maps/api/js?sensor=false";
    else
      $gmapScriptURL = "//maps.googleapis.com/maps/api/js?key=$this->googleMapsApiV3Key&sensor=false";
    
    
    wp_enqueue_script("GoogleMapsAPIv3", $gmapScriptURL, $noDep);
    wp_enqueue_script("OverlappingMarkerSpiderfier", plugins_url( "js/oms.min.js" , __FILE__ ), array("GoogleMapsAPIv3"), $this->version, false);
    wp_enqueue_script("ExifReader", plugins_url( "js/ExifReader.js" , __FILE__ ), $noDep, $this->version, false);
    wp_enqueue_script("geotagged_pics_to_map", plugins_url( "js/picstomap.js" , __FILE__ ), $jsDep, $this->version, false);
    
    wp_enqueue_style("jquery-style", plugins_url( 'style/jquery-ui-1.10.3.custom.min.css' , __FILE__ ), array(), $this->version ); 
  }

  function shortcode( $atts, $content = null ) {
    return get_open_link($content);
  }

  function get_open_link($content = null){
    if ($content == null)
      $content = __("Click here to show the map");
    return '<a href="#" class="geotagged_pics_open_map">'.$content.'</a>';
  }
}

new geotagged_pics_to_map();

