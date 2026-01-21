const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-cyan-900 flex justify-center items-center py-20 px-4">
      {children}
    </div>
  );
};

export default AuthLayout;
