const handleReset = (e) => {
   e.preventDefault();
   if (newPassword === confirmPassword) {
      alert("Password Reset Successful!");
      router.push('/about');
   } else {
      alert("Passwords do not match");
   }
}