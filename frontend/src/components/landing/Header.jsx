import ArvLogoLight from "../../assets/images/Logo with text(white background).png"
import ArvLogoDark from "../../assets/images/Logo with text(dark background).png"

function Header() {
    return (
        <div className="md:w-full md:h-56 w-56 h-full p-3 grid md:grid-rows-1 md:grid-cols-5 gap-0">
            <div className="w-full h-full">
                <a href="/frontend/public" className="flex items-center justify-center w-full h-full overflow-hidden">
                    <img src={ArvLogoLight} alt="" className="h-full aspect-square object-contain w-[80%]"/>
                    <img src={ArvLogoDark} alt="" className="dark:block hidden aspect-square object-contain w-[80%]"/>
                </a>
            </div>
            <div className="w-full h-full">

            </div>
            <div className="w-full h-full bg-primary-green-300"></div>
            <div className="w-full h-full bg-amber-700"></div>
            <div className="w-full h-full bg-amber-800"></div>
        </div>
    )
}

export default Header;