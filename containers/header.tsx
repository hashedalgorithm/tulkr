import logo from "data-base64:~assets/icon.png"

const Header = () => {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <img src={logo} className="h-auto w-8" />
        <h3 className="text-3xl font-medium">T&uacute;lkr</h3>
      </div>
      <p className="text-center text-sm text-ring">
        Customize your experience with personalized subtitles.
      </p>
    </div>
  )
}

export default Header
