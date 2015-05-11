(function($){
    $( "#sortable" ).sortable();
    $( "#sortable" ).disableSelection();
    
	if(typeof datepicker !== 'undefined'){
		$('.datepicker').datepicker({
		    format: 'MM,dd yyyy'
		});
	}

  	$(".open-modal").click(function(e) {
  		_this = $(this)
		$.ajax({
			url: _this.data("url"),
			cache: false
		}).done(function( data ) {			
			$('#myModal').find('div.modal-content').html(data)
	  		$('#myModal').modal('show')
	  		if (typeof initialize == 'function') { initialize() }
		});  		
	});

	$("#myModal").on('click', '.delete-record', function(event) {
		if (confirm('Are you sure?')) {
			var form = $("#modal_form")	
			data     = form.serializeJSON()
			data._method = "DELETE"
			$.ajax({
				type: "DELETE",
				url: form.attr("action"),
				data: data
			}).done(function( data ) {		
				if(data.status == "saved")	{ 
					$('#myModal').modal('hide') 
					window.location.href = data.url;
				}
				else $('#myModal').find('div.modal-content').html(data)
			});
    	}
	});

	$("#myModal").on('click', '.modal-save', function(event) {
  		var form = $("#modal_form")	
  		data     = form.serializeJSON()
		$.ajax({
			type: "POST",
			url: form.attr("action"),
			data: data
		}).done(function( data ) {		
			if(data.status == "saved")	{ 
				$('#myModal').modal('hide') 
				window.location.href = data.url;
			}
			else $('#myModal').find('div.modal-content').html(data)
		});  		
	});

  	$("#add_survey_question").click(function(e) {
  		e.preventDefault() 
		$.ajax({
			url: "/survey/question_partial",
			cache: false,
			data: {question_index : $('.question_group').length}
		}).done(function( data ) {
			$(".questions").append(data);
			setInputNames()
			console.log("data");
		});
	});

	function setInputNames(){
		$('.question_group').each(function(question_index, element) {
			$(this).find( "input.question" ).attr("name", "questions["+question_index+"][question]");
			$(this).find( "select.type" ).attr("name", "questions["+question_index+"][type]");
			$(this).find( "input.response" ).each(function(response_index, element) {
				$(this).attr("name", "questions["+question_index+"][responses]["+response_index+"][response]");
			});
		});
	}
 
  $("#survey").on('change', '.type', function(event) {
  	event.preventDefault()
  	if($( event.target ).val() == "date"){
  		$( event.target ).closest( "div.question_group" ).find('div.response_div').remove()  		
  	}	
  })

  $("#survey").on('click', '.delete_response', function(event) {
  	event.preventDefault()
  	target =  $( event.target ).closest( "div.response_div" )
  	target.hide('slow', function(){ target.remove(); setInputNames();});
  })

  $("#survey").on('click', '.delete_question', function(event) {
  	event.preventDefault()
  	target =  $( event.target ).closest( "div.question_group" )
  	target.hide('slow', function(){ target.remove(); setInputNames();});
  })

  $("#survey").on('click', '.add_question_response', function(event) {
	$.ajax({
		url: "/survey/question_response_partial",
		cache: false,
		data: {question_index : 0, response_index : 0}
		}).done(function( data ) {
				$( event.target ).closest( "div.question_group" ).append(data);
				setInputNames();
			});
		});

	$(window).load(function() {
		$('.loader').fadeOut();
		$('.page-loader').delay(350).fadeOut('slow');
	});

	$(document).ready(function() {

		var homeSection = $('.home-section'),
			navbar      = $('.navbar-custom'),
			navHeight   = navbar.height(),
			width       = Math.max($(window).width(), window.innerWidth),
			mobileTest;

		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			mobileTest = true;
		}

		buildHomeSection(homeSection);
		navbarAnimation(navbar, homeSection, navHeight);
		navbarSubmenu(width);
		hoverDropdown(width, mobileTest);

		$(window).resize(function() {
			var width = Math.max($(window).width(), window.innerWidth);
			buildHomeSection(homeSection);
			hoverDropdown(width, mobileTest);
		});

		$(window).scroll(function() {
			effectsHomeSection(homeSection, this);
			navbarAnimation(navbar, homeSection, navHeight);
		});

		/* ---------------------------------------------- /*
		 * Home section height
		/* ---------------------------------------------- */

		function buildHomeSection(homeSection) {
			if (homeSection.length > 0) {
				if (homeSection.hasClass('home-full-height')) {
					homeSection.height($(window).height());
				} else {
					homeSection.height($(window).height() * 0.85);
				}
			}
		};

		/* ---------------------------------------------- /*
		 * Home section effects
		/* ---------------------------------------------- */

		function effectsHomeSection(homeSection, scrollTopp) {
			if (homeSection.length > 0) {
				var homeSHeight = homeSection.height();
				var topScroll = $(document).scrollTop();
				if ((homeSection.hasClass('home-parallax')) && ($(scrollTopp).scrollTop() <= homeSHeight)) {
					homeSection.css('top', (topScroll * 0.55));
				}
				if (homeSection.hasClass('home-fade') && ($(scrollTopp).scrollTop() <= homeSHeight)) {
					var caption = $('.caption-content');
					caption.css('opacity', (1 - topScroll/homeSection.height() * 1));
				}
			}
		};
		/* ---------------------------------------------- /*
		 * Transparent navbar animation
		/* ---------------------------------------------- */

		function navbarAnimation(navbar, homeSection, navHeight) {
			var topScroll = $(window).scrollTop();
			if (navbar.length > 0 && homeSection.length > 0) {
				if(topScroll >= navHeight) {
					navbar.removeClass('navbar-transparent');
				} else {
					navbar.addClass('navbar-transparent');
				}
			}
		};

		/* ---------------------------------------------- /*
		 * Navbar submenu
		/* ---------------------------------------------- */

		function navbarSubmenu(width) {
			if (width > 767) {
				$('.navbar-custom .navbar-nav > li.dropdown').hover(function() {
					var MenuLeftOffset  = $('.dropdown-menu', $(this)).offset().left;
					var Menu1LevelWidth = $('.dropdown-menu', $(this)).width();
					if (width - MenuLeftOffset < Menu1LevelWidth * 2) {
						$(this).children('.dropdown-menu').addClass('leftauto');
					} else {
						$(this).children('.dropdown-menu').removeClass('leftauto');
					}
					if ($('.dropdown', $(this)).length > 0) {
						var Menu2LevelWidth = $('.dropdown-menu', $(this)).width();
						if (width - MenuLeftOffset - Menu1LevelWidth < Menu2LevelWidth) {
							$(this).children('.dropdown-menu').addClass('left-side');
						} else {
							$(this).children('.dropdown-menu').removeClass('left-side');
						}
					}
				});
			}
		};

		/* ---------------------------------------------- /*
		 * Navbar hover dropdown on desctop
		/* ---------------------------------------------- */

		function hoverDropdown(width, mobileTest) {
			if ((width > 767) && (mobileTest != true)) {
				$('.navbar-custom .navbar-nav > li.dropdown, .navbar-custom li.dropdown > ul > li.dropdown').removeClass('open');
				var delay = 0;
				var setTimeoutConst;
				$('.navbar-custom .navbar-nav > li.dropdown, .navbar-custom li.dropdown > ul > li.dropdown').hover(function() {
					var $this = $(this);
					setTimeoutConst = setTimeout(function() {
						$this.addClass('open');
						$this.find('.dropdown-toggle').addClass('disabled');
					}, delay);
				},
				function() {
					clearTimeout(setTimeoutConst);
					$(this).removeClass('open');
					$(this).find('.dropdown-toggle').removeClass('disabled');
				});
			} else {
				$('.navbar-custom .navbar-nav > li.dropdown, .navbar-custom li.dropdown > ul > li.dropdown').unbind('mouseenter mouseleave');
				$('.navbar-custom [data-toggle=dropdown]').not('.binded').addClass('binded').on('click', function(event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().siblings().removeClass('open');
					$(this).parent().siblings().find('[data-toggle=dropdown]').parent().removeClass('open');
					$(this).parent().toggleClass('open');
				});
			}
		};


		$(document).on('click','.navbar-collapse.in',function(e) {
			if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
				$(this).collapse('hide');
			}
		});


		var module = $('.home-section, .module, .module-small, .side-image');
		module.each(function(i) {
			if ($(this).attr('data-background')) {
				$(this).css('background-image', 'url(' + $(this).attr('data-background') + ')');
			}
		});

		$('.progress-bar').each(function(i) {
			$(this).appear(function() {
				var percent = $(this).attr('aria-valuenow');
				$(this).animate({'width' : percent + '%'});
				$(this).find('span').animate({'opacity' : 1}, 900);
				$(this).find('span').countTo({from: 0, to: percent, speed: 900, refreshInterval: 30});
			});
		});

		$('.count-item').each(function(i) {
			$(this).appear(function() {
				var number = $(this).find('.count-to').data('countto');
				$(this).find('.count-to').countTo({from: 0, to: number, speed: 1200, refreshInterval: 30});
			});
		});
		$('.section-scroll').bind('click', function(e) {
			var anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $(anchor.attr('href')).offset().top
			}, 1000);
			e.preventDefault();
		});

		$(window).scroll(function() {
			if ($(this).scrollTop() > 100) {
				$('.scroll-up').fadeIn();
			} else {
				$('.scroll-up').fadeOut();
			}
		});

		$('a[href="#totop"]').click(function() {
			$('html, body').animate({ scrollTop: 0 }, 'slow');
			return false;
		});

		$('#subscription-form').submit(function(e) {

			e.preventDefault();
			var $form           = $('#subscription-form');
			var submit          = $('#subscription-form submit');
			var ajaxResponse    = $('#subscription-response');
			var email           = $('input#semail').val();

			$.ajax({
				type: 'POST',
				url: 'assets/php/subscribe.php',
				dataType: 'json',
				data: {
					email: email
				},
				cache: false,
				beforeSend: function(result) {
					submit.empty();
					submit.append('<i class="fa fa-cog fa-spin"></i> Wait...');
				},
				success: function(result) {
					if(result.sendstatus == 1) {
						ajaxResponse.html(result.message);
						$form.fadeOut(500);
					} else {
						ajaxResponse.html(result.message);
					}
				}
			});

		});

	});

})(jQuery);