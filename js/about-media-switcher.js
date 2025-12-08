// About Section - Video/Image Switcher
// Plays YouTube video first, then shows image for 5 seconds, then loops

(function() {
    'use strict';

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    let player;
    let isVideoPlaying = false;
    let imageTimeout;

    // This function will be called by YouTube API when ready
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player('about-youtube-video', {
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };

    function onPlayerReady(event) {
        // Video is ready, it will autoplay due to autoplay=1 in URL
        isVideoPlaying = true;
    }

    function onPlayerStateChange(event) {
        // YT.PlayerState.ENDED = 0
        if (event.data === YT.PlayerState.ENDED) {
            // Video finished, show image
            showImage();
        } else if (event.data === YT.PlayerState.PLAYING) {
            isVideoPlaying = true;
        }
    }

    function showImage() {
        const videoContainer = document.getElementById('about-video-container');
        const imageContainer = document.getElementById('about-image-container');

        // Hide video, show image
        videoContainer.style.display = 'none';
        imageContainer.style.display = 'block';
        isVideoPlaying = false;

        // After 5 seconds, show video again
        imageTimeout = setTimeout(() => {
            showVideo();
        }, 5000); // 5 seconds
    }

    function showVideo() {
        const videoContainer = document.getElementById('about-video-container');
        const imageContainer = document.getElementById('about-image-container');

        // Hide image, show video
        imageContainer.style.display = 'none';
        videoContainer.style.display = 'block';

        // Replay the video
        if (player && player.playVideo) {
            player.playVideo();
            isVideoPlaying = true;
        }
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (imageTimeout) {
            clearTimeout(imageTimeout);
        }
    });

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && player && player.pauseVideo) {
            player.pauseVideo();
        } else if (!document.hidden && player && player.playVideo && isVideoPlaying) {
            player.playVideo();
        }
    });

})();
