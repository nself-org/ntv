' nTV Roku — NTVScene controller
' Fetches library from nSelf stream-gateway and handles D-pad navigation.

sub init()
    m.videoPlayer = m.top.findNode("videoPlayer")
    m.contentGrid = m.top.findNode("contentGrid")
    m.spinner = m.top.findNode("spinner")

    m.videoPlayer.observeField("state", "onVideoStateChange")
    m.contentGrid.observeField("itemSelected", "onItemSelected")

    ' Load stream list from nSelf backend (env var injected at package time)
    fetchStreamList()
end sub

' handleDeepLink — called by Main() when Roku passes a deep-link
function handleDeepLink(args as object) as void
    if args.contentID <> invalid
        playContent(args.contentID)
    end if
end function

' fetchStreamList — GET /api/streams from nSelf stream-gateway plugin
sub fetchStreamList()
    backendURL = ReadAsciiFile("pkg:/config/backend.txt").trim()
    if backendURL = ""
        showError("Backend URL not configured. Re-sideload with a valid backend.txt.")
        return
    end if

    request = CreateObject("roUrlTransfer")
    request.setURL(backendURL + "/api/streams")
    request.addHeader("Accept", "application/json")
    port = CreateObject("roMessagePort")
    request.setMessagePort(port)
    request.asyncGetToString()

    msg = wait(5000, port)
    if type(msg) = "roUrlEvent" and msg.getResponseCode() = 200
        streams = ParseJSON(msg.getString())
        populateGrid(streams)
    else
        showError("Could not reach nSelf backend.")
    end if
end sub

sub populateGrid(streams as object)
    if streams = invalid or streams.count() = 0
        showError("No streams available.")
        return
    end if

    contentList = CreateObject("roSGNode", "ContentNode")
    for each stream in streams
        item = contentList.createChild("ContentNode")
        item.title = stream.title
        item.streamFormat = "hls"
        item.url = stream.hlsUrl
        if stream.posterUrl <> invalid
            item.hdPosterUrl = stream.posterUrl
        end if
    end for

    m.contentGrid.content = contentList
    m.contentGrid.visible = true
    m.spinner.visible = false
    m.contentGrid.setFocus(true)
end sub

sub onItemSelected()
    item = m.contentGrid.content.getChild(m.contentGrid.itemSelected)
    if item <> invalid
        playContent(item.url)
    end if
end sub

sub playContent(url as string)
    m.contentGrid.visible = false
    m.videoPlayer.visible = true

    content = CreateObject("roSGNode", "ContentNode")
    content.url = url
    content.streamFormat = "hls"

    m.videoPlayer.content = content
    m.videoPlayer.control = "play"
    m.videoPlayer.setFocus(true)
end sub

sub onVideoStateChange()
    if m.videoPlayer.state = "finished" or m.videoPlayer.state = "error"
        m.videoPlayer.visible = false
        m.videoPlayer.control = "stop"
        m.contentGrid.visible = true
        m.contentGrid.setFocus(true)
    end if
end sub

sub showError(msg as string)
    m.spinner.visible = false
    errLabel = m.top.findNode("errLabel")
    if errLabel = invalid
        errLabel = m.top.createChild("Label")
        errLabel.id = "errLabel"
        errLabel.translation = "[200, 500]"
        errLabel.font = "font:MediumSystemFont"
        errLabel.color = "0xFF4444FF"
    end if
    errLabel.text = msg
    errLabel.visible = true
end sub
