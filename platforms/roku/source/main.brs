' nTV Roku — Main entry point
' BrightScript / SceneGraph app

sub Main(args as dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)

    scene = screen.CreateScene("NTVScene")
    screen.show()

    ' Pass deep-link args to scene (Roku streaming store requirement)
    if args.contentID <> invalid and args.mediaType <> invalid
        scene.callFunc("handleDeepLink", {
            contentID: args.contentID,
            mediaType: args.mediaType
        })
    end if

    while true
        msg = wait(0, port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed()
                exit while
            end if
        end if
    end while
end sub
