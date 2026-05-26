import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import backgroundImage from '../assets/background.png';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo
              size={36}
              textClassName="text-white text-xl font-semibold tracking-wide"
              className="[&>div:first-child]:bg-white/10 [&>div:first-child]:border-white/20 [&>div:first-child]:text-white"
            />
          </div>
          <button
            onClick={() => navigate('/role-selection')}
            className="px-8 py-2 border border-white text-white rounded hover:bg-white hover:text-blue-900 transition-all duration-300"
          >
            LOGIN
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div 
        className="flex-1 flex items-center justify-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 58, 90, 0.5), rgba(30, 58, 90, 0.5)), url(${backgroundImage})`,
          backgroundSize: '100% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '80vh'
        }}
      >
        <div className="text-center text-white px-4 z-10 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.15em] mb-2 leading-tight">
            EXCELLENCE IN
          </h1>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.15em] mb-6 leading-tight">
            MAINTENANCE
          </h1>
          <p className="text-sm md:text-base mb-10 font-light italic tracking-widest opacity-90">
            A dedicated portal for our residents and dedicated staff.
          </p>
          <button
            onClick={() => navigate('/role-selection')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-full text-base font-medium tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
          >
            ENTER PORTAL
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-transparent text-white text-xs px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="tracking-wider">© 2024 TENANTFLOW. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8 tracking-wider">
            <a href="#" className="hover:underline">PRIVACY</a>
            <a href="#" className="hover:underline">TERMS</a>
            <a href="#" className="hover:underline">CONTACT</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
