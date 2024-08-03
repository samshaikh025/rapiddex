export default function Header() {
    return(
        <nav className="navbar navbar-expand-lg navbar-light ">
          <div className="container">
            <a className="navbar-brand" href="#">
              <h2 className="icon">SwapDex</h2>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse justify-content-center" id="navbarSupportedContent">
              <ul className="navbar-nav justify-content-cente mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="/swap">Swap</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">loans</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">liqididy</a>
                </li>

                <li className="nav-item">
                  <a className="nav-link" href="#">Stak</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Stak</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
    )
}