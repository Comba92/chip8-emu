const KB: usize = 1024;
const RAM_SIZE: usize = 2 * KB;

pub struct CPU {
  pub ram: [u8; RAM_SIZE],
  pub pc: u16,
  pub reg_a: u8,
  pub reg_x: u8,
  pub reg_y: u8,
  pub status: u8,
}

impl CPU {
  pub fn new() -> Self {
    CPU {
      ram: [0; RAM_SIZE],
      pc: 0,
      reg_a: 0,
      reg_x: 0,
      reg_y: 0,
      /*
        0, C: carry
        1, Z: zero
        2, I: interrupt disable
        3, D: decimal mode - useless
        4, B: break command
        5, empty
        6, V: overflow
        7, N: negative
      */
      status: 0,
    }
  }

  pub fn interpret(&mut self, program: Vec<u8>) {
    self.pc = 0;

    loop {
      let opscode = program[self.pc as usize];
      self.pc += 1;

      match opscode {
        0x00 => return,
        0xA9 => {
          let param = program[self.pc as usize];
          self.pc += 1;
          self.lda(param);
        }
        0xAA => self.tax(),
        0xE8 => self.inx(),
        _ => todo!(),
      }
    }
  }

  fn lda(&mut self, value: u8) {
    self.reg_a = value;
    self.update_zero_and_negative_flags(self.reg_a);
  }

  fn tax(&mut self) {
    self.reg_x = self.reg_a;
    self.update_zero_and_negative_flags(self.reg_x)
  }

  fn inx(&mut self) {
    self.reg_x = self.reg_x.wrapping_add(1);
    self.update_zero_and_negative_flags(self.reg_x)
  }

  fn update_zero_and_negative_flags(&mut self, result: u8) {
    if result == 0 {
      self.status = self.status | 0b0000_0010;
    } else {
      self.status = self.status & 0b1111_1101;
    }

    if result & 0b1000_0000 != 0 {
      self.status = self.status | 0b1000_0000;
    } else {
      self.status = self.status & 0b0111_1111;
    }
  }
}
