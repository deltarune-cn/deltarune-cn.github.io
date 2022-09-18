// vendor

$.fancybox.defaults.buttons = ['close'];
$.fancybox.defaults.infobar = false;
dayjs.extend(window.dayjs_plugin_relativeTime)


// the good stuff

var javascript_version = 8;
var keep_polling = true;
var supports_websockets = true;
var current_websocket = false;
var last_update = false;
var last_update_ts = false;
var ends_at = false;
var ends_at_ts = false;
var current_total = false;
var current_goal = false;
var current_poll = false;
var current_poll_metadata = false;
var final_goal = false;
var time_up = false;
var websockets_enabled = false;
var side_image = 0;
var current_data = false;
var toast_count = 0;
var last_donation_id = false;
var queued_toasts = [];
var debug_mode = false;
var force_stop_all_websockets = false;
var polltimeout = null;

var cool_gifs = ['cash1.gif', 'cash2.gif', 'cash3.gif', 'cash1.gif', 'email1.gif', 'email2.gif', 'email3.gif', 'free1.gif', 'free2.gif', 'free3.gif', 'free4.gif', 'free5.gif', 'freemoney.gif', 'thanks1.gif', 'thanks2.gif', 'thanks3.gif', 'cool.gif', 'new.gif'];

function refreshData() {
  // cancel all current polls
  if (polltimeout) {
    clearTimeout(polltimeout);
  }
  // if websocket is open, don't poll.
  if (current_websocket && current_websocket.readyState == 1) {
    return;
  }
  if (debug_mode) {
    console.log("poll requested");
  }
  updateLastUpdated();
  $.ajax({
    url: "https://spamton-prizes.fangamer.workers.dev/?" + dayjs().endOf('minute').valueOf(),
    success: function(data) {
      updateData(data)
    },
    error: function(xhr, status, error) {
      console.log("uh oh");
      console.log(xhr, status, error);
    }
  });
  if (keep_polling) {
    polltimeout = setTimeout(refreshData, 60000);
  }
}

function updateData(data) {
  // if the javascript version doesn't match, sometime in 1-10 seconds. random to prevent a complete overload
  if (javascript_version != data.javascript_version) {
    setTimeout(function(){
      window.location = window.location;
    },Math.floor(Math.random() * 9000)+1000);
  }

  if (last_update_ts != data.updated_at) {
    createOrUpdateMarquee();
    current_total = data.donation_total;
    current_goal = data.donation_goal;
    final_goal = data.donation_goal;

    $('.prize.revealed').addClass('orphaned');
    for (var i = 0; i < data.prizes.length; i++) {
      createOrUpdatePrize(data.prizes[i]);
    }
    $('.prize.revealed.orphaned').remove();

    $('.prize.locked').addClass('orphaned');
    for (var i = 0; i < data.locked.length; i++) {
      createOrUpdateLockedPrize(data.locked[i]);
      if (data.locked[i].threshold !== null && data.locked[i].threshold < current_goal) {
        current_goal = data.locked[i].threshold;
      }
    }
    $('.prize.locked.orphaned').remove();

    $('.auction-card-container').addClass('orphaned');
    for (var i = 0; i < data.auctions.length; i++) {
      createOrUpdateAuction(data.auctions[i]);
    }
    $('.auction-card-container.orphaned').remove();

    // Check for polls
    if (data.polls.length > 0) {
      current_poll = data.polls[0];
      if (data.poll_metadata) {
        current_poll_metadata = data.poll_metadata;
      }
    } else {
      current_poll = false;
      current_poll_metadata = false;
    }

    last_update_ts = data.updated_at;
    last_update = dayjs(data.updated_at);
    ends_at_ts = data.ends_at;
    ends_at = dayjs(parseInt(data.ends_at));
    updateProgress();

    current_data = data;

    if (!last_donation_id && data.recent_donations.length > 0) {
      last_donation_id = data.recent_donations[0].id;
    }

    checkToasts();
  }
  updateLastUpdated();

  websockets_enabled = data.websockets_enabled;
  force_stop_all_websockets = data.force_stop_all_websockets;
  if (force_stop_all_websockets && current_websocket) {
    current_websocket.close();
  }
  if (websockets_enabled && current_websocket == false) {
    joinWebSocket();
  }
}

function updateLastUpdated() {
  if (current_websocket) {
    $('.last-updated').html("Updating <span style='color: #FF2020'>LIVE</span>");
  } else if (time_up) {
    $('.last-updated').html("Connection lost.. Try refreshing?</a>");
  } else if (last_update) {
    $('.last-updated').html("Last updated <span data-toggle='tooltip' data-title='" + last_update.toString() + "'>" + last_update.fromNow() + "</span><small>(refreshes automatically)</small>");
    $('[data-toggle="tooltip"]').tooltip();
  }
}

function updateCountdown() {
  if (ends_at) {
    if (dayjs().isAfter(ends_at)) {
      time_up = true;
      $('.countdown').html("TIME'S UP!!!");
      $('body').addClass('time-up');
    } else {
      var seconds = ends_at.diff(dayjs(), 'second');
      var hours = Math.floor(seconds / (60 * 60));
      seconds -= hours * (60 * 60);
      var minutes  = Math.floor(seconds / 60);
      seconds -= minutes * 60;
      $('.countdown').html(('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2) + ' REMAINING');
    }
  }
  if (!time_up) {
    setTimeout(updateCountdown, 1000);
  }
}

function createOrUpdateMarquee() {
  var marquee = $("#marquee_container .marquee").first();
  if (marquee.length > 0) {
    // Marquee exists, nothing to do
  } else {
    // Fresh reload, create marquee
    var marquee_body = "<span class='marquee-text'><span class='donation-total'>$" + current_total + "</span> RAISED SO FAR</span><img src='/assets/images/spamton-phone1.png' alt='PHONE' /><img src='/assets/images/spamton-phone2.png' alt='PHONE' /><img src='/assets/images/spamton-phone3.png' alt='PHONE' /><span class='marquee-text'><span class='countdown'>NOT MUCH LONGER!!!!!!!!!</span></span><img src='/assets/images/spamton-phone1.png' alt='PHONE' /><img src='/assets/images/spamton-phone2.png' alt='PHONE' /><img src='/assets/images/spamton-phone3.png' alt='PHONE' /><span class='marquee-text'>DONATE NOW OR REGRET IT FOREVER!!!!!!!!!!</span><img src='/assets/images/spamton-phone1.png' alt='PHONE' /><img src='/assets/images/spamton-phone2.png' alt='PHONE' /><img src='/assets/images/spamton-phone3.png' alt='PHONE' />";
    $("#marquee_container").append("<div class='marquee'>" + marquee_body + "</div><div class='marquee' aria-hidden='true'>" + marquee_body + "</div>");
  }
}

function updateProgress() {
  if (current_goal == final_goal) {
    $('.goal-text').addClass('all-unlocked');
  } else {
    $('.goal-text').removeClass('all-unlocked');
  }
  $('#main_progress').removeClass('winning');
  $('#alt_progress').removeClass('winning');
  $('.option-image').removeClass('winning');

  if (current_poll == false) {
    // Normal mode, update bar
    $('#progress').removeClass('poll-mode');

    var percent = Math.round((current_total / current_goal) * 100);
    $('#main_progress').attr('aria-valuenow', current_total);
    $('#main_progress').attr('aria-valuemax', current_goal);
    $('#main_progress').css('width', percent + '%');
    $('#main_progress .sr-only').html(percent + '% to next goal, $' + current_total + ' donated, goal of $' + current_total);
    $('#progress_text').html("SO FAR WE HAVE RAISED <span class='donation-total'></span> FOR CHILD'S PLAY CHARITY!!!");
    $('#progress_text').removeClass('poll-mode');
  } else {
    // Poll mode, balance bars
    $('#progress').addClass('poll-mode');

    var option1_name = current_poll.options[0].name;
    var option2_name = current_poll.options[1].name;

    var option1_amount = current_poll.options[0].totalAmountRaised;
    var option2_amount = current_poll.options[1].totalAmountRaised;
    if (option1_amount == 0) {
      option1_amount = 0.000001;
    }
    if (option2_amount == 0) {
      option2_amount = 0.000001;
    }
    var options_total = option1_amount + option2_amount;

    var option1_percent = Math.round((option1_amount / options_total) * 100);
    var option2_percent = Math.round((option2_amount / options_total) * 100);

    $('#main_progress').attr('aria-valuenow', option1_amount);
    $('#main_progress').attr('aria-valuemax', options_total);
    $('#main_progress').css('width', option1_percent + '%');
    $('.option1-total').html('$' + option1_amount.toFixed(2));
    $('#main_progress .sr-only').html(option1_percent + '% voted for ' + option1_name);
    $('#alt_progress').attr('aria-valuenow', option2_amount);
    $('#alt_progress').attr('aria-valuemax', options_total);
    $('#alt_progress').css('width', option2_percent + '%');
    $('.option2-total').html('$' + option2_amount.toFixed(2));
    $('#alt_progress .sr-only').html(option2_percent + '% voted for ' + option2_name);
    if (current_poll_metadata) {
      $('#progress_text').html(current_poll_metadata.description);
      if ($('#option1').length == 0) {
        $('#progress_text').append('<img id="option1" class="option-image" src="' + current_poll_metadata.options[0].image + '" alt="' + current_poll_metadata.options[0].name + '" />');
      } else {
        $('#option1').attr('src', current_poll_metadata.options[0].image);
      }
      if ($('#option2').length == 0) {
        $('#progress_text').append('<img id="option2" class="option-image" src="' + current_poll_metadata.options[1].image + '" alt="' + current_poll_metadata.options[1].name + '" />');
      } else {
        $('#option2').attr('src', current_poll_metadata.options[1].image);
      }
    } else {
      $('#progress_text').html("POLL!!");
    }
    $('#progress_text').addClass('poll-mode');

    if (option1_amount > option2_amount) {
      $('#main_progress').addClass('winning');
      $('#option1').addClass('winning');
    } else if (option1_amount < option2_amount) {
      $('#alt_progress').addClass('winning');
      $('#option2').addClass('winning');
    }
  }

  $('.donation-total').html('$' + current_total.toFixed(2));
  $('.donation-goal').html('$' + current_goal.toFixed(2).replace('.00', ''));

  $('#progress').removeClass('not-loaded');
}

function createOrUpdatePrize(prize) {
  var prize_id = prize.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/-$/, '').replace(/^-/, '');
  var modal_id = prize_id + '_modal';
  var title_id = prize_id + '_title';
  var prize_div = $("#" + prize_id).first();
  if (prize_div.length > 0) {
    // TODO: Prize exists, update DOM
    prize_div.removeClass('orphaned');
    $("#" + prize_id + " .prize-title").html(prize.name);
    $("#" + modal_id + " .description").html(prize.description);
  } else {
    // New prize, create DOM
    $("#prizes").append("<div id='" + prize_id + "' class='prize revealed col-lg-3 col-md-4 col-sm-6'></div>");
    $("#" + prize_id).append("<button data-toggle='modal' data-target='#" + modal_id + "'></button>");
    $("#" + prize_id + " button").append("<div class='prize-thumbnail-container'></div>");
    $("#" + prize_id + " .prize-thumbnail-container").append("<img class='prize-thumbnail' src='" + prize.images[0] + "' alt='" + prize.name + "' loading='lazy' />");
    $("#" + prize_id + " button").append("<div class='prize-title-container'></div>");
    $("#" + prize_id + " .prize-title-container").append("<span class='prize-title'>" + prize.name + "</span>");

    $("#modals").append("<div id='" + modal_id + "' class='modal' aria-labelledby='" + title_id + "' role='dialog' tabindex='-1' data-mp4='" + prize.video_mp4 + "' data-webm='" + prize.video_webm + "'></div>");
    $("#" + modal_id).append("<div class='modal-dialog modal-lg' role='document'><div class='modal-content'></div></div>");
    $("#" + modal_id + " .modal-content").append("<div class='modal-header'><button class='close' aria-label='Close' data-dismiss='modal' type='button'><span aria-hidden='true'>脳</span></button><h3 id='" + title_id + "' class='modal-title sr-only'>" + prize.name + "</h3></div>");
    $("#" + modal_id + " .modal-content").append("<div class='modal-body'></div>");
    $("#" + modal_id + " .modal-body").append("<div class='row'><div class='col-md-6'><div class='prize-header-container'></div><div class='video-container embed-responsive embed-responsive-16by9'></div><div class='images-container'></div></div><div class='col-md-6'><div class='description-container'></div></div></div>");
    $("#" + modal_id + " .prize-header-container").append("<img src='" + prize.header + "' class='prize-header' alt='" + prize.name + "' />");
    $("#" + modal_id + " .video-container").append("<video class='video' autoplay muted playsinline loop poster='" + prize.images[0] + "'></video>");
    for (var i = 0; i < prize.images.length; i++) {
      $("#" + modal_id + " .images-container").append("<a href='" + prize.images[i] + "' class='prize-image' data-fancybox='gallery_" + prize_id + "'><img src='" + prize.images[i] + "' loading='lazy' alt='" + prize.name + "' />");
    }
    $("#" + modal_id + " .description-container").append("<div class='value-tag-container' aria-hidden='true'></div>");
    $("#" + modal_id + " .value-tag-container").append("<div class='value-tag'></div>");
    $("#" + modal_id + " .value-tag").append("<img src='/assets/images/angel-flip.gif' class='price-angel' />");
    $("#" + modal_id + " .value-tag").append("<span class='value'>" + prize.value + "</span>");
    $("#" + modal_id + " .description-container").append("<span class='value-free'>FREE!!!!!<small>*</small></span>");
    $("#" + modal_id + " .description-container").append("<div class='description'></div>");
    $("#" + modal_id + " .description").append(prize.description);
  }
}

function createOrUpdateLockedPrize(prize) {
  var prize_handle = prize.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/-$/, '').replace(/^-/, '');
  var prize_id = "locked_" + prize_handle;
  var prize_div = $("#" + prize_id).first();
  if (prize_div.length > 0) {
    // Prize exists, update DOM
    prize_div.removeClass('orphaned');
    $("#" + prize_id + " .prize-title").html(prize.name);
    if (prize.threshold !== null) {
      $("#" + prize_id + " .prize-threshold").html("$" + prize.threshold + " to unlock!");
    } else {
      $("#" + prize_id + " .prize-threshold").html("");
    }
  } else {
    // New prize, create DOM
    if (prize.threshold === null) {
      prize.threshold = "???";
    }
    $("#prizes").append("<div id='" + prize_id + "' class='prize locked col-lg-3 col-md-4 col-sm-6'></div>");
    $("#" + prize_id).append("<button disabled=true aria-label='Locked prize! Unlocks at $" + prize.threshold + "'></button>");
    $("#" + prize_id + " button").append("<div class='prize-thumbnail-container'></div>");
    $("#" + prize_id + " .prize-thumbnail-container").append("<img class='prize-thumbnail' src='" + prize.image + "' alt='" + prize.name + "' loading='lazy' />");
    $("#" + prize_id + " .prize-thumbnail-container").append("<span class='prize-thumbnail-locked'>LOCKED!!<small class='prize-threshold'></small></span>");
    if (prize.threshold != "???") {
      $("#" + prize_id + " .prize-threshold").html("$" + prize.threshold + " to unlock!");
    }
    $("#" + prize_id + " button").append("<div class='prize-title-container'></div>");
    $("#" + prize_id + " .prize-title-container").append("<span class='prize-title'>" + prize.name + "</span>");
  }
}

function createOrUpdateAuction(auction) {
  var auction_id = auction.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/-$/, '').replace(/^-/, '');
  var modal_id = auction_id + '_modal';
  var title_id = auction_id + '_title';
  var auction_div = $("#" + auction_id).first();
  if (auction_div.length > 0) {
    // Old auction, update DOM
    auction_div.removeClass('orphaned');
    $("#" + auction_id + " .auction-title").html(auction.name);
    if (!auction.ended) {
      $("#" + auction_id + " .current-bid").html(auction.amount);
    }

    $("#" + modal_id + " h2").html(auction.name);
    if (!auction.ended) {
      $("#" + modal_id + " .current-bid").html(auction.amount);
    }
    $("#" + modal_id + " .auction-description").html(auction.description);
  } else {
    // New auction, create DOM
    $("#auctions").append("<div id='" + auction_id + "' class='col-md-5'></div>");
    $("#" + auction_id).append("<button class='auction-card' data-toggle='modal' data-target='#" + modal_id + "'></button>");
    $("#" + auction_id + " button").append("<div class='auction-thumbnail-container'></div>");
    $("#" + auction_id + " .auction-thumbnail-container").append("<img class='auction-thumbnail' src='" + auction.image_preview + "' alt='" + auction.name + "' loading='lazy' />");
    $("#" + auction_id + " button").append("<div class='auction-title-container'></div>");
    $("#" + auction_id + " .auction-title-container").append("<span class='auction-title'>" + auction.name + "</span>");
    if (!auction.ended) {
      $("#" + auction_id + " button").append("<div class='current-bid-container'><div class='current-bid-label'>CURRENT BID:</div></div>");
      $("#" + auction_id + " .current-bid-container").append("<span class='current-bid'>" + auction.amount + "</span>");
    }

    $("#modals").append("<div id='" + modal_id + "' class='modal auction' aria-labelledby='" + title_id + "' role='dialog' tabindex='-1' data-mp4='" + auction.video_mp4 + "' data-webm='" + auction.video_webm + "'></div>");
    $("#" + modal_id).append("<div class='modal-dialog modal-lg' role='document'><div class='modal-content'></div></div>");
    $("#" + modal_id + " .modal-content").append("<div class='modal-header'><h5 id='" + title_id + "' class='modal-title'>" + auction.name + "</h5><button class='close' aria-label='Close' data-dismiss='modal' type='button'><span aria-hidden='true'>脳</span></button></div>");
    $("#" + modal_id + " .modal-content").append("<div class='modal-body'></div>");
    $("#" + modal_id + " .modal-body").append("<div class='video-container embed-responsive embed-responsive-16by9'></div><div class='images-container'></div>");
    $("#" + modal_id + " .video-container").append("<video class='video' autoplay muted playsinline loop poster='" + auction.images[0] + "'></video>");
    for (var i = 0; i < auction.images.length; i++) {
      $("#" + modal_id + " .images-container").append("<a href='" + auction.images[i] + "' class='prize-image' data-fancybox='gallery_" + auction_id + "'><img src='" + auction.images[i] + "' loading='lazy' alt='" + auction.name + "' />");
    }
    $("#" + modal_id + " .modal-body").append("<div class='current-bid-container'></div>");
    if (!auction.ended) {
      $("#" + modal_id + " .current-bid-container").append("<div class='current-bid-label'>CURRENT BID:</div>");
      $("#" + modal_id + " .current-bid-container").append("<div class='current-bid'>" + auction.amount + "</div>");
    }
    $("#" + modal_id + " .modal-body").append("<div class='auction-description'>" + auction.description + "</div>");
    $("#" + modal_id + " .modal-body").append("<div class='bid-button-container'></div>");
    $("#" + modal_id + " .bid-button-container").append("<a href='https://www.ebay.com/itm/" + auction.ebay_id + "' target='_blank' class='btn bid-button'>PLACE YOUR BID NOW</div>");
  }
}

function shuffleGifs() {
  var containers = $('.gif-container').length;
  $('.gif-container').html('');
  for (var gifs = 0; gifs < containers; gifs++) {
    addGifToContainer($('.gif-container').eq(gifs));
    addGifToContainer($('.gif-container').eq(gifs));
  }
  for (var sprinkles = 0; sprinkles < containers; sprinkles++) {
    addGifToContainer($('.gif-container').eq(getRandomInt(0, containers)));
  }
  if (!time_up) {
    setTimeout(shuffleGifs, 3000);
  }
}

function addGifToContainer(container) {
  var random_gif = '/assets/images/coolgifs/' + cool_gifs[getRandomInt(0, cool_gifs.length)];
  var random_top = getRandomInt(0, 80);
  var random_left = getRandomInt(0, 50);
  var random_rotation = getRandomInt(-20, 20);
  container.append("<img src='" + random_gif + "' style='top: " + random_top + "%; left: " + random_left + "%; transform: rotate(" + random_rotation + "deg);' aria-hidden='true' />");
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function shuffleBanners() {
  $('#random_banner .banner').addClass('hidden');
  $('#random_banner .banner').eq(getRandomInt(0, $('#random_banner .banner').length)).removeClass('hidden');
  if (!time_up) {
    setTimeout(shuffleBanners, 60000);
  }
}

function shuffleSides() {
  $('.big-money img').addClass('hidden');
  side_image += 1;
  if (side_image >= $('#big_money img').length) {
    side_image = 0;
  }
  $('#big_money img').eq(side_image).removeClass('hidden');
  $('#big_money_flip img').eq(side_image).removeClass('hidden');
  if (!time_up) {
    setTimeout(shuffleSides, 1500);
  }
}

function money() {
  var random_gif = '/assets/images/coolgifs/money' + getRandomInt(1, 8) + '.gif';
  $('#money_container').append("<img class='money' src='" + random_gif + "' style='left: " + getRandomInt(5, 95) + "%;' />");
  if ($('.money').length > 10) {
    $('.money').first().remove();
  }
  if (!time_up) {
    setTimeout(money, getRandomInt(100, 1500));
  }
}

function toastPost(donation) {
  toast_count += 1;
  var toast_image = '/assets/images/happycustomer' + getRandomInt(1, 9) + '.png';
  var toast_towards = "";
  var toast_message = "";
  var toast_color = "#FFFFFF";
  if (current_poll && current_poll_metadata && donation['pollOptionId'] !== undefined) {
    if (donation.pollOptionId == current_poll.options[0].id) {
      toast_color = "#478EFE";
      toast_towards = " toward <span class='toast-toward' style='color: " + toast_color + "'>" + current_poll_metadata.options[0].name + "</span>";
    } else if (donation.pollOptionId == current_poll.options[1].id) {
      toast_color = "#909090";
      toast_towards = " toward <span class='toast-toward' style='color: " + toast_color + "'>" + current_poll_metadata.options[1].name + "</span>";
    } 
  }
  if (donation.comment !== null) {
    toast_message = "<span class='toast-message'>" + escapeHTML(donation.comment) + "</span>";
  }
  $('#toast_hell').append("<div id='toast_" + toast_count + "' class='toast'><div class='toast-body media'><img class='toast-iamge' src='" + toast_image + "' /><div class='media-body'><strong class='toast-name'>" + escapeHTML(donation.name) + "</strong> donated <strong class='toast-amount'>$" + donation.amount.toFixed(2).replace('.00', '') +"</strong>" + toast_towards + "!!" + toast_message + "</div></div></div>");
  $('.progress-frame-container').append("<span class='floating-text' style='left: " + getRandomInt(0, 90) + "%; top: " + getRandomInt(30, 90) + "%; color: " + toast_color + ";'>+$" + donation.amount.toFixed(2).replace('.00', '') + "</span>");
  var new_toast = $('#toast_' + toast_count);
  new_toast.toast({ 'delay': 5000 });
  new_toast.toast('show');
  setTimeout(checkToasts, getRandomInt(100, 1000));
}

function escapeHTML(html) {
  return document.createElement('div').appendChild(document.createTextNode(html)).parentNode.innerHTML;
}

function workThroughQueue() {
  if (queued_toasts.length > 0) {
    toastPost(queued_toasts.pop());
  }
  $('.toast.fade.hide').remove();
  if ($('.floating-text').length > 10) {
    $('.floating-text').first().remove();
  }
  var next_toast = getRandomInt(100, 1000);
  if (current_websocket == false) {
    next_toast = getRandomInt(750, 3000);
  }
  setTimeout(workThroughQueue, next_toast);
}

function checkToasts() {
  if (current_data) {
    var donations_fifo = current_data.recent_donations.reverse();
    for (var i = 0; i < donations_fifo.length; i++) {
      var donation = donations_fifo[i];
      if (donation.id > last_donation_id) {
        queued_toasts.push(donation);
        last_donation_id = donation.id;
      }
    }
  }
}

$(document).on('click', '.jump-link', function(e) {
  e.preventDefault();
  document.getElementById($(this).attr('data-href')).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
});


$(document).ready(function() {
  refreshData();
  updateCountdown();
  shuffleGifs();
  shuffleBanners();
  shuffleSides();
  money();
  workThroughQueue();
});

// Lazyload video on modal open
$(document).on('show.bs.modal', '.modal', function() {
  if ($(this).find('.video source').length == 0 && $(this).data('webm') !== null && $(this).data('mp4') !== null) {
    $(this).find(".video").append("<source src='" + $(this).data('webm') + "' type='video/webm'>");
    $(this).find(".video").append("<source src='" + $(this).data('mp4') + "' type='video/mp4'>");
  }
});


// experimental websocket garbage
function joinWebSocket() {
  if (force_stop_all_websockets) {
    return;
  }

  var websocket_host = "wss://spamton-prizes.fangamer.workers.dev/ws";

  var ws = false;
  var rejoined = false;
  var start_time = Date.now();

  if (current_websocket) {
    current_websocket.close();
  }

  if (supports_websockets == true) {
    try {
      if (debug_mode) {
        console.log("Connecting to WebSocket...");
      }
      ws = new WebSocket(websocket_host);
      current_websocket = ws;
      // keep polling until we have a connection
      keep_polling = true;
    } catch(e) {
      if (debug_mode) {
        console.log("Client does not support WebSockets, keep polling");
      }
      ws = false;
      keep_polling = true;
      supports_websockets = false;
      refreshData();
    }
  } else {
    if (debug_mode) {
      console.log("Client does not support WebSockets");
    }
  }

  if (ws && supports_websockets) {
    let rejoin = async () => {
      if (!rejoined) {
        rejoined = true;
        refreshData(); // start polling

        // Don't try to reconnect too rapidly.
        let time_since_last_join = Date.now() - start_time;
        if (time_since_last_join < 10000) {
          // Less than 10 seconds elapsed since last join. Pause a bit.
          await new Promise(resolve => setTimeout(resolve, 10000 - time_since_last_join));
        }

        // OK, reconnect now!
        if (current_websocket) {
          current_websocket.close();
        }
        current_websocket = false;
        joinWebSocket();
      }
    }

    ws.addEventListener("open", event => {
      current_websocket = ws;
      keep_polling = false;
      updateLastUpdated();
      if (debug_mode) {
        console.log("Connected to WebSocket!");
      }
    });

    ws.addEventListener("message", event => {
      let data = JSON.parse(event.data);

      if (data.error) {
        if (debug_mode) {
          console.log("Error: ", data.error);
        }
      } else if (data.data) {
        if (debug_mode) {
          console.log('got data');
          console.log(data.data);
        }
        updateData(data.data);
      } else {
        if (debug_mode) {
          console.log(data);
        }
      }
    });

    ws.addEventListener("close", event => {
      if (debug_mode) {
        console.log("WebSocket closed, reconnecting:", event.code, event.reason);
      }
      keep_polling = true;
      // only rejoin if the local ws is global ws
      if (websockets_enabled && ws == current_websocket && !force_stop_all_websockets) {
        rejoin();
      }
    });
    ws.addEventListener("error", event => {
      if (debug_mode) {
        console.log("WebSocket error, reconnecting:", event);
      }
      keep_polling = true;
      // only rejoin if the local ws is global ws
      if (websockets_enabled && ws == current_websocket && !force_stop_all_websockets) {
        rejoin();
      }
    });
  }
}